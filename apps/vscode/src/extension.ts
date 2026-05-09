import * as vscode from "vscode";
import { GeneratorTreeProvider } from "./providers/GeneratorTreeProvider";

export function activate(context: vscode.ExtensionContext) {
  const registryUrl = vscode.workspace
    .getConfiguration("xo")
    .get<string>("registryUrl", "https://api.xo.dev");

  const templatesProvider = new GeneratorTreeProvider(registryUrl, "Project");
  const featuresProvider = new GeneratorTreeProvider(registryUrl, "Feature");

  vscode.window.registerTreeDataProvider("xo.templates", templatesProvider);
  vscode.window.registerTreeDataProvider("xo.features", featuresProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand("xo.refresh", () => {
      templatesProvider.refresh();
      featuresProvider.refresh();
    }),

    vscode.commands.registerCommand("xo.runTemplate", async (item: GeneratorItem) => {
      const name = item?.name ?? await vscode.window.showInputBox({ prompt: "Template name (e.g. next-app)" });
      if (!name) return;
      runInTerminal(`xo create ${name}`);
    }),

    vscode.commands.registerCommand("xo.runFeature", async (item: GeneratorItem) => {
      const name = item?.name ?? await vscode.window.showInputBox({ prompt: "Feature name (e.g. ui/button)" });
      if (!name) return;
      runInTerminal(`xo add ${name}`);
    }),

    vscode.commands.registerCommand("xo.openSettings", () => {
      vscode.commands.executeCommand("workbench.action.openSettings", "xo");
    }),
  );
}

function runInTerminal(command: string) {
  const terminal = vscode.window.createTerminal({ name: "xo" });
  terminal.show();
  terminal.sendText(command);
}

export function deactivate() {}

export { GeneratorItem } from "./providers/GeneratorTreeProvider";
