const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { User } = require('../models');
const videoService = require('./video.service');
const config = require('../configs/config');
const fs = require('fs');
const path = require('path');
const mime = require('mime'); // 导入 mime 模块
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid'); // 用于生成唯一的文件名

const extractEmail = (fromText) => {
  const emailMatch = fromText.match(/<(.+?)>/);
  return emailMatch ? emailMatch[1] : fromText;
};

const saveEmailReply = async (parsed, bodyBuffer) => {
  try {
    // 检查并创建附件存储文件夹
    const attachmentsDir = path.join(__dirname, '../../attachments');
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir);
    }

    const email = {
      from: extractEmail(parsed.from.text),
      to: extractEmail(parsed.to.text),
      cc: parsed.cc ? extractEmail(parsed.cc.text) : undefined,
      subject: parsed.subject,
      date: parsed.date,
      content: bodyBuffer || 'No body content', // 使用已经解码的正文
      attachments: [], // 初始化附件数组
    };

    let users = [];
    if (email.cc) {
      // 邮箱字符检查时忽略大小写
      const user = await User.findOne({ email: email.cc.toLowerCase() });
      if (user) {
        users.push(user);
        // console.log(`User found with email: ${email.cc}`);
      } else {
        console.log(`No user found with email: ${email.cc}`);
        return;
      }
    } else {
      // 查找用户并保存反馈信息
      const all_users = await User.find();
      // 邮箱字符检查时忽略大小写
      users = all_users.filter((user) =>
        // user.suppliers.some((supplier) => supplier.contact === email.from)
        user.suppliers.some((supplier) => supplier.contact.toLowerCase() === email.from.toLowerCase())
      );
      // console.log(`Users ${users.length} still found with supplier's email: ${email.from}`);
    }
    if (!users || !users.length) {
      console.log(`No suppliers found with email: ${email.from}`);
      return;
    }

    // 如果有附件
    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const att of parsed.attachments) {
        try {
          // 生成唯一的文件名
          const uniqueFileName = `${uuidv4()}.${mime.extension(att.contentType) || 'bin'}`;

          // 构建保存文件的完整路径
          const filePath = path.join(__dirname, '../../attachments', uniqueFileName);

          // 将内容写入文件
          fs.writeFileSync(filePath, att.content);

          const fileUrl = `/api/attachments/${uniqueFileName}`;

          console.log(`Attachment saved to: ${fileUrl}`);

          // 更新 email.attachments
          email.attachments.push({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
            content: fileUrl,
          });

          // 如果类型是pdf，调用 Python 脚本进行解析
          console.log(`Attachment content type: ${att.contentType}`);
          if (att.contentType === 'application/pdf' || att.contentType === 'pdf') {
            // 调用 Python 脚本进行解析
            const pythonProcess = spawn('python', [path.join(__dirname, '../python/parse_files.py'), filePath]);
            let pythonOutput = '';
            pythonProcess.stdout.on('data', (data) => {
              pythonOutput += data.toString();
            });
            pythonProcess.stderr.on('data', (data) => {
              console.error(`stderr: ${data}`);
            });
            pythonProcess.on('close', async (code) => {
              if (code === 0) {
                try {
                  const parsedData = JSON.parse(pythonOutput);
                  // 保存文件信息到数据库
                  for (let user of users) {
                    const supplier = user.suppliers.find((supplier) => supplier.contact.toLowerCase() === email.from.toLowerCase());
                    if (!supplier) {
                      console.log(`No supplier found with email: ${email.from}`);
                      continue;
                    }
                    await videoService.createVideo({
                      title: att.filename,
                      path: fileUrl,
                      addedBy: users[0]._id,
                      json: parsedData, // 如果你想存储解析的数据
                      supplier: supplier._id,
                    });
                  }
                } catch (videoError) {
                  console.error('Error saving video information:', videoError);
                }
              } else {
                console.error('Error processing file with Python script');
              }
            });
          } else {
            const parsedData = {};
            // 保存文件信息到数据库
            for (let user of users) {
              const supplier = user.suppliers.find((supplier) => supplier.contact.toLowerCase() === email.from.toLowerCase());
              if (!supplier) {
                console.log(`No supplier found with email: ${email.from}`);
                continue;
              }
              await videoService.createVideo({
                title: att.filename,
                path: fileUrl,
                addedBy: users[0]._id,
                json: parsedData, // 如果你想存储解析的数据
                supplier: supplier._id,
              });
            }
          }
        } catch (attError) {
          console.error(`Error processing attachment ${att.filename}:`, attError);
        }
      }
    }

    // console.log('Email:', email);

    for (let user of users) {
      const supplier = user.suppliers.find((supplier) => supplier.contact.toLowerCase() === email.from.toLowerCase());
      if (!supplier) {
        console.log(`No supplier found with email: ${email.from}`);
        continue;
      }
      supplier.feedback.push(email);
      await user.save();
    }
  } catch (error) {
    console.error('Error in saveEmailReply:', error);
    // 根据需要决定是否抛出错误或在此处理
  }
};

const emailListener = (io) => {
  const imapConfig = {
    user: config.email.imap.user,
    password: config.email.imap.password,
    host: config.email.imap.host,
    port: config.email.imap.port,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false,
    },
    keepalive: {
      interval: 30000, // 每隔30秒发送心跳包
      idleInterval: 300000, // 5分钟空闲后发送 NOOP
      forceNoop: true, // 如果服务器不支持 IDLE，强制使用 NOOP 命令
    },
  };

  const imap = new Imap(imapConfig);
  imap.setMaxListeners(0); // 防止内存泄漏警告

  const connectToImap = () => {
    imap.connect();
  };

  const openInbox = (cb) => {
    imap.openBox('INBOX', false, cb); // 打开 INBOX，并确保有写权限（false 表示可写）
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
        struct: true,
      });

      f.on('message', (msg, seqno) => {
        let allBuffers = []; // 用于存储邮件内容

        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            allBuffers.push(chunk); // 将所有数据块保存到数组中
          });
        });

        msg.once('end', async () => {
          try {
            const fullMessage = Buffer.concat(allBuffers).toString('utf8');

            simpleParser(fullMessage, async (err, parsed) => {
              if (err) {
                console.error('Error parsing email:', err);
                return;
              }

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
          } catch (e) {
            console.error('Error processing message:', e);
          }
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
    // 根据错误类型进行处理
    if (err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET') {
      console.log('IMAP 连接超时或被重置，正在尝试重新连接...');
      imap.end(); // 确保之前的连接已关闭
      setTimeout(connectToImap, 5000); // 等待5秒后重新连接
    } else {
      // 处理其他错误
      console.error('IMAP 发生未知错误');
      process.exit(1); // 或者根据需要采取其他措施
    }
  });

  imap.once('end', () => {
    console.log('IMAP connection ended, attempting to reconnect...');
    setTimeout(connectToImap, 5000); // 等待5秒后重新连接
  });

  imap.once('close', (hadError) => {
    console.log(`IMAP connection closed, hadError = ${hadError}`);
    if (hadError) {
      console.log('由于错误导致连接关闭，正在尝试重新连接...');
      setTimeout(connectToImap, 5000);
    } else {
      console.log('IMAP 连接正常关闭。');
    }
  });

  connectToImap();
};

module.exports = emailListener;
