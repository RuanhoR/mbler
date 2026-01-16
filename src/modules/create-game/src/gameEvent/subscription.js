/**游戏订阅句柄*/
export class GameEventSubscription {
    event;
    callback;
    constructor(event, callback) {
        this.event = event;
        this.callback = callback;
    }
    /**取消订阅事件 */
    unsubscribe() {
        this.event.unsubscribe(this.callback);
    }
}
