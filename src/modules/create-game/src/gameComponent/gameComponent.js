export class GameComponent {
    options;
    _isAttached = false;
    /**是否已经attach */
    get isAttached() {
        return this._isAttached;
    }
    state;
    /**tag */
    tag;
    get context() {
        return this.state.context;
    }
    get runner() {
        return this.state.runner;
    }
    constructor(state, options, tag) {
        this.options = options;
        this.state = state;
        this.tag = tag;
    }
    _onAttach() {
        try {
            this._isAttached = true;
            this.onAttach();
        }
        catch (err) {
            this._isAttached = false;
            throw err;
        }
    }
    _onDetach() {
        this.state.eventManager.unsubscribeBySubscriber(this);
        this.onDetach();
        this._isAttached = false;
    }
    /**随便重写 */
    onDetach() { }
    /**订阅事件 */
    subscribe(event, ...args) {
        if (!this.isAttached)
            return;
        return this.state.eventManager.subscribe(this, event, ...args);
    }
    /**取消订阅 */
    unsubscribe(sub) {
        this.state.eventManager.unsubscribe(sub);
    }
}
