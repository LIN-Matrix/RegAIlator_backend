const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Email = require('../models/email.model'); // 引入邮件模型
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
        console.log('Message #%d', seqno);
        let buffer = '';

        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
        });

        msg.once('end', () => {
          console.log(`Parsed header for message #${seqno}:`);
          simpleParser(buffer, async (err, parsed) => {
            if (err) {
              console.error('Error parsing email:', err);
              return;
            }

            console.log('Parsed email:', parsed);
            // 存储邮件到MongoDB
            try {
              const email = new Email({
                from: parsed.from.text,
                to: parsed.to.text,
                subject: parsed.subject,
                date: parsed.date,
                text: parsed.text,
                html: parsed.html
              });

              // 保存邮件到MongoDB
              await email.save();
              console.log('Email saved to MongoDB:', email);

              // 通过 WebSocket 发送给前端
              io.emit('newEmail', email); // 向所有连接的客户端广播新邮件
              console.log('New email sent to front-end via WebSocket');

            } catch (saveError) {
              console.error('Error saving email to MongoDB:', saveError);
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
