import * as vscode from "vscode";

export interface GeneratorData {
  name: string;
  description?: string;
  githubUrl: string;
  downloads: number;
  author: { name?: string };
}

export class GeneratorItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly data: GeneratorData,
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);

    this.tooltip = [
      data.description ?? "",
      `Author: ${data.author.name ?? "unknown"}`,
      `Downloads: ${data.downloads}`,
      data.githubUrl,
    ]
      .filter(Boolean)
      .join("\n");

    this.description = data.description ?? "";
    this.contextValue = "generator";
    this.iconPath = new vscode.ThemeIcon("package");

    this.command = {
      title: "Run",
      command: "xo.runFeature",
      arguments: [this],
    };
  }
}

export class GeneratorTreeProvider implements vscode.TreeDataProvider<GeneratorItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<GeneratorItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private cache: GeneratorData[] = [];

  constructor(
    private readonly registryUrl: string,
    private readonly type: "Project" | "Feature",
  ) {}

  refresh() {
    this.cache = [];
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: GeneratorItem) {
    return element;
  }

  async getChildren(): Promise<GeneratorItem[]> {
    if (this.cache.length === 0) {
      this.cache = await this.fetchGenerators();
    }
    return this.cache.map((g) => new GeneratorItem(g.name, g));
  }

  private async fetchGenerators(): Promise<GeneratorData[]> {
    try {
      const res = await fetch(`${this.registryUrl}/api/generators?type=${this.type}&limit=50`);
      if (!res.ok) return [];
      const json = (await res.json()) as { data: GeneratorData[] };
      return json.data ?? [];
    } catch {
      vscode.window.showWarningMessage("xo: Could not reach registry. Check your connection or registry URL in settings.");
      return [];
    }
  }
}
