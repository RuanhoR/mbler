import i18n from "../i18n";
import { CliParam } from "../types";
import { input, showText } from "../utils";
import { TokenManger } from "../publisher/tokenManger";

export async function loginCommand(cliParam: CliParam, work: string) {
  let token = cliParam.params[1];
  if (!token) {
    token = await input("Token: ", true);
  }

  if (!token) {
    showText("Token is required");
    return -1;
  }

  try {
    const prevToken = await TokenManger.getToken();
    await TokenManger.setToken(token.trim());
    await TokenManger.waitVeirfy();
    if (!TokenManger.isLogin) {
      if (prevToken && typeof prevToken === "string") {
        await TokenManger.setToken(prevToken);
        await TokenManger.waitVeirfy();
      }
      showText("Login failed: invalid token");
      return -1;
    }
    showText(`Login successful: ${TokenManger.user?.name || "unknown user"}`);
    return 0;
  } catch (error) {
    showText(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
    return -1;
  }
}
