#!/bin/bash

while true; do
    # 启动 npm run dev，并将输出重定向到 out.log
    npm run dev > out.log 2>&1 &
    NPM_PID=$!
    echo "已启动 npm run dev，进程ID为 $NPM_PID"

    # 监控 out.log 文件的新内容
    tail -n0 -F out.log | while read LINE; do
        echo "$LINE" | grep -q "IMAP connection closed"
        if [ $? -eq 0 ]; then
            echo "检测到 IMAP connection closed，正在重新启动 npm run dev..."
            kill $NPM_PID
            break
        fi
    done

    # 等待 npm run dev 进程退出
    wait $NPM_PID
    echo "npm run dev 已退出，1秒后重新启动..."
    sleep 1
done
