export type InlineText = string;

export interface PBlock { type: 'p'; text: InlineText }
export interface H3Block { type: 'h3'; text: string }
export interface UlBlock { type: 'ul'; items: InlineText[] }
export interface CalloutBlock { type: 'callout'; text: InlineText }
export interface QuoteBlock { type: 'quote'; text: InlineText; cite?: string }

export type Block = PBlock | H3Block | UlBlock | CalloutBlock | QuoteBlock;

export interface Section {
  heading: string;
  body: Block[];
}

export interface HelpPage {
  title: string;
  lead?: string;
  sections: Section[];
  footer?: string;
}

export interface LocalizedHelp {
  ja: HelpPage;
  en: HelpPage;
}
