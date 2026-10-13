export type AINode = {
  text: string;
  icon?: string;
  children?: AINode[];
};

export type AIMindMap = {
  title: string;
  children: AINode[];
};

export type GenerateRequest =
  | { mode: "new"; prompt: string }
  | { mode: "expand"; prompt: string; nodeText: string; context: string[] };
