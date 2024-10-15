const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Email = require('../models/email.model'); // 引入邮件模型
const {User} = require('../models');
const config = require('../configs/config');

const emailListener = (io) => {
  const imapConfig = {
    user: config.email.imap.user,
    password: config.email.imap.password,
    host: config.email.imap.host,
    port: config.email.imap.port,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
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
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        markSeen: true, // 标记邮件为已读
        struct: true
      });

      f.on('message', (msg, seqno) => {
        var bodyBuffer = ''; // 用于存储邮件正文
        var contentType = ''; // 存储邮件内容的类型（plain 或 html）
        const prefix = `(#${seqno}) `;

        // console.log('Message #%d', seqno);
        let buffer = '';

        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
        });

        msg.once('attributes', function(attrs) {
          // 提取正文部分
          var parts = attrs.struct;
          let fetchPartPromises = []; // 用来追踪所有的body part fetch操作

          parts.forEach(function(part) {
            if (Array.isArray(part)) {
              part.forEach(function(subPart) {
                if (subPart.subtype === 'plain' || subPart.subtype === 'html') {
                  var encoding = subPart.encoding;
                  contentType = subPart.subtype;

                  // Fetch body part by partID
                  fetchPartPromises.push(new Promise((resolve, reject) => {
                    var f2 = imap.fetch(attrs.uid, {
                      bodies: [subPart.partID],
                      struct: true
                    });

                    f2.on('message', function(msg2) {
                      msg2.on('body', function(stream2) {
                        var buffer = '';
                        stream2.on('data', function(chunk) {
                          buffer += chunk.toString('utf8');
                        });

                        stream2.once('end', function() {
                          if (encoding === 'BASE64') {
                            // Decode BASE64 content
                            var decodedContent = Buffer.from(buffer, 'base64').toString('utf8');
                            bodyBuffer += decodedContent;
                          } else {
                            // Handle other encoding types if necessary
                            bodyBuffer += buffer;
                          }
                          // console.log(prefix + 'Decoded content (' + contentType + '):', bodyBuffer);
                          resolve(); // 成功获取并处理了body部分
                        });
                      });
                    });

                    f2.once('error', function(err) {
                      console.log('Fetch error: ' + err);
                      reject(err);
                    });

                    f2.once('end', function() {
                      console.log('Done fetching body part.');
                    });
                  }));
                }
              });
            }
          });

          // 等待所有的body部分都被fetch完毕后再处理email
          Promise.all(fetchPartPromises).then(() => {
            // console.log(`All body parts fetched for message #${seqno}`);
            // Process the email after the body is fully fetched
            simpleParser(buffer, async (err, parsed) => {
              if (err) {
                console.error('Error parsing email:', err);
                return;
              }

              // console.log('Parsed email:', parsed);
              
              // 1. 存储邮件到MongoDB
              try {
                const email = new Email({
                  from: parsed.from.text,
                  to: parsed.to.text,
                  subject: parsed.subject,
                  date: parsed.date,
                  text: bodyBuffer, // 使用已经解码的正文
                  html: parsed.html
                });

                // 保存邮件到MongoDB
                await email.save();
                console.log('Email saved to MongoDB:', email);

                // 2. 根据发件人的邮箱查找数据库中的学生或用户
                const senderEmail = parsed.from.value[0].address; // 获取发件人的邮箱地址

                const user = await User.findOne({ 'email': senderEmail }); // 查找匹配的学生记录
                if (user) {
                  // user
                  // console.log('user:', user);
                  // 3. 更新学生记录的 `reply` 字段为最新邮件内容
                  user.emails = [...user.emails, email];
                  await user.save();
                  // 打印出更新后的user
                  // console.log('user after update:', user);
                } else {
                  console.log(`No user found with email: ${senderEmail}`);
                }

                // 4. 通过 WebSocket 发送给前端
                io.emit('newEmail', email); // 向所有连接的客户端广播新邮件
                console.log('New email sent to front-end via WebSocket');

              } catch (saveError) {
                console.error('Error saving email to MongoDB:', saveError);
              }
            });
          }).catch((fetchErr) => {
            console.error('Error fetching body parts:', fetchErr);
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
