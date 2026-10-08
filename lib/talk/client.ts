import { createTalkApi, type TalkApi } from "./api";

/** 界面用的那一份；组件测试里整个模块会被换成假的 */
export const talkApi: TalkApi = createTalkApi();
