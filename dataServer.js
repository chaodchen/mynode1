const WebSocket = require('ws');
const readline = require('readline');


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("请输入端口号 (默认8080)\n", (answer) => {
    let port = 8080;
    if (answer != '') {
        port = Number(answer.trim());
    }
    console.log(`您的端口号为: %d`, port);
    rl.close();
    start(port);
});

function start(port) {
    const wss = new WebSocket.Server({ port: port });
    const androidClient = new Set();
    const webClient = new Set();

    wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        console.log("androidDeviceLen: %d\nwebDeviceLen: %d", androidClient.size, webClient.size);
        let msg = JSON.parse(message);

        switch (msg['type']) {
        case 'android_login':
            console.log("Android登录");
            androidClient.add(ws);
            break;
        case 'android_exit':
            console.log("Android退出");
            androidClient.delete(ws);
            break;
        case 'web_login':
            console.log("web登录");
            webClient.add(ws);
            break;
        case 'web_exit':
            console.log("web退出");
            webClient.delete(ws);
            break;
        case 'android_say':
            console.log("android发数据到web");
            webClient.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                delete msg.type;
                if (msg.call === "getGameData") {
                    // 处理 输赢平
                    console.log("处理输赢平");
                    console.log(msg.data);
                    msg.data.forEach(item => {
                        item.header.wld = item.header.win + '/' + item.header.lose + '/' + item.header.draw
                        delete item.header.win
                        delete item.header.lose
                        delete item.header.draw
                    });
                }
                client.send(JSON.stringify(msg));
            }
            });
            break;
        case 'web_say':
            console.log("web发指令到android");
            androidClient.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                delete msg.type;
                client.send(JSON.stringify(msg));
            }
            });
            break;
        default:
        }
    });

    ws.on('close', function () {
        console.log("客户端断开连接");

        // 在客户端关闭连接时，从相应的集合中移除
        androidClient.delete(ws);
        webClient.delete(ws);
    });
    });
    console.log("WebSocket服务器已启动");
}

