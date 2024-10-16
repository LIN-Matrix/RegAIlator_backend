const Imap = require('imap');
const { simpleParser } = require('mailparser');
const {User} = require('../models');
const config = require('../configs/config');
const fs = require('fs');
const path = require('path');

const extractEmail = (fromText) => {
  const emailMatch = fromText.match(/<(.+?)>/);
  return emailMatch ? emailMatch[1] : fromText;
};

const { v4: uuidv4 } = require('uuid'); // 用于生成唯一的文件名
const saveEmailReply = async (parsed, bodyBuffer) => {
  // 检查并创建附件存储文件夹
  const attachmentsDir = path.join(__dirname, '../attachments');
  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir);
  }

  const email = {
    from: extractEmail(parsed.from.text),
    to: extractEmail(parsed.to.text),
    subject: parsed.subject,
    date: parsed.date,
    content: bodyBuffer || 'No body content', // 使用已经解码的正文
    attachments: [] // 初始化附件数组
  };

  // 如果有附件
  if (parsed.attachments && parsed.attachments.length > 0) {
    for (const att of parsed.attachments) {
      // 生成唯一的文件名（使用 uuid 和 .pdf 后缀）
      const uniqueFileName = `${uuidv4()}.pdf`;

      // 构建保存文件的完整路径 (你可以根据需要调整存储路径)
      const filePath = path.join(__dirname, '../../attachments', uniqueFileName);

      // 将 Base64 内容写入 PDF 文件
      fs.writeFileSync(filePath, att.content);

      const fileUrl = `/attachments/${uniqueFileName}`;

      console.log(`Attachment saved to: ${fileUrl}`);

      // 将附件信息更新到 email.attachments 中，保存文件路径，注意不要存储了buffer
      email.attachments.push({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
        content: fileUrl
      });
    }
  }

  // 查找用户并保存反馈信息（不变的部分）
  const all_users = await User.find();
  const users = all_users.filter(user => user.suppliers.some(supplier => supplier.contact === email.from));

  if (!users || !users.length) {
    console.log(`No suppliers found with email: ${email.from}`);
    return;
  }

  for (let user of users) {
    const supplier = user.suppliers.find(supplier => supplier.contact === email.from);
    supplier.feedback.push(email);
    await user.save();
  }
  return;
};

const emailListener = (io) => {
  const imapConfig = {
    user: config.email.imap.user,
    password: config.email.imap.password,
    host: config.email.imap.host,
    port: config.email.imap.port,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
    },
    keepalive: {
      interval: 10000, // 每隔10秒发送心跳包，保持连接活跃
      idleInterval: 300000, // 5分钟空闲后重置连接
      forceNoop: true // 如果服务器不支持 IDLE，强制使用 NOOP 命令
    }
  };

  const imap = new Imap(imapConfig);

  const openInbox = (cb) => {
    imap.openBox('INBOX', false, cb); // 打开 INBOX，并确保有写权限（false表示可写）
  };

  const processNewMessages = () => {
    imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        console.error('Error searching for new emails:', err);
        return;
      }
      if (!results || !results.length) {
        console.log('No new unseen emails.');
        return;
      }
  
      const f = imap.fetch(results, {
        bodies: '',
        markSeen: true, // 标记邮件为已读
        struct: true
      });
  
      f.on('message', (msg, seqno) => {
        let allBuffers = []; // 用于存储邮件内容
  
        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            allBuffers.push(chunk); // 将所有数据块保存到数组中
          });
        });
  
        msg.once('end', async () => {
          // 完整地抓取邮件后，合并所有数据块
          const fullMessage = Buffer.concat(allBuffers).toString('utf8');
  
          // 使用 simpleParser 解析邮件，包括正文和附件
          simpleParser(fullMessage, async (err, parsed) => {
            if (err) {
              console.error('Error parsing email:', err);
              return;
            }
  
            // console.log('Parsed email:', parsed);
  
            try {
              // 保存邮件以及附件（如果有）
              await saveEmailReply(parsed, parsed.text || parsed.html);
  
              // 通过 WebSocket 发送给前端
              io.emit('newEmail', parsed); 
              console.log('New email sent to front-end via WebSocket');
            } catch (saveError) {
              console.error('Error when saving and sending email:', saveError);
            }
          });
        });
      });
  
      f.once('error', (err) => {
        console.error('Fetch error:', err);
      });
  
      f.once('end', () => {
        console.log('Done fetching unseen emails.');
      });
    });
  };

  imap.once('ready', () => {
    openInbox((err) => {
      if (err) {
        console.error('Error opening inbox:', err);
        return;
      }

      console.log('Mailbox opened, starting to listen for new emails...');
      processNewMessages();

      imap.on('mail', () => {
        console.log('New email detected, processing...');
        processNewMessages();
      });
    });
  });

  imap.once('error', (err) => {
    console.error('IMAP error:', err);
  });

  imap.once('end', () => {
    console.log('IMAP connection ended');
  });

  imap.connect();
};

module.exports = emailListener;
