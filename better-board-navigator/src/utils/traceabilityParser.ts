class HashPrefixRemover {
  private prefixesByLength: Map<number, Set<string>> = new Map();
  private lengths: number[] = [];

  constructor() {
    const PREFIXES_TO_REMOVE = [
      'OPEN', 'RES', 'LNK', 'IND', 'CAP', 'TRN', 'TRP', 
      'MOS', 'DIO', 'ZEN', 'LED', 'TRC', 'TRF'
    ];

    PREFIXES_TO_REMOVE.forEach(p => {
      const len = p.length;
      if (!this.prefixesByLength.has(len)) {
        this.prefixesByLength.set(len, new Set());
      }
      this.prefixesByLength.get(len)!.add(p);
    });

    this.lengths = Array.from(this.prefixesByLength.keys()).sort((a, b) => b - a);
  }

  public clean(text: string): string {
    const textLen = text.length;

    for (const length of this.lengths) {
      if (textLen < length) continue;
      
      const prefix = text.substring(0, length);
      if (this.prefixesByLength.get(length)?.has(prefix)) {
        return text.substring(length).trim();
      }
    }
    return text;
  }
}

export class TraceabilityFailsParser {
  private prefixRemover = new HashPrefixRemover();

  public parse(texts: string[]): string[] {
    const testPointsPattern = /^(SHO|FLOAT|LNK2TP)/;
    const componentsSet = new Set<string>();

    for (const text of texts) {
      if (testPointsPattern.test(text)) {
        const subResult = this.getTestPoints(text);
        subResult.forEach(res => componentsSet.add(res));
      } else {
        const sanitizedText = this.sanitizeToAlphaNumeric(text);
        const subResult = this.getComponentsFromSanitizedString(sanitizedText);
        subResult.forEach(res => componentsSet.add(res));
      }
    }

    return Array.from(componentsSet);
  }

  private getTestPoints(text: string): string[] {
    const prefixedGroupsPattern = /\([A-Z]+\s*([\d\s,-]+)\)/g;
    const matches = Array.from(text.matchAll(prefixedGroupsPattern));
    
    if (matches.length > 0) {
      const result: string[] = [];
      for (const match of matches) {
        const numbers = match[1].match(/\d+/g) || [];
        result.push(...numbers);
      }
      if (result.length > 0) return result;
    }

    const testPointsInLastBracketPattern = /\(([\d\s]+)\)/;
    const bracketMatch = text.match(testPointsInLastBracketPattern);
    if (bracketMatch) {
      return bracketMatch[1].trim().split(/\s+/);
    }
    
    const testPointsHyphenPattern = /\b(\d+)-(\d+)\s*$/;
    const hyphenMatch = text.match(testPointsHyphenPattern);
    if (hyphenMatch) {
      return [hyphenMatch[1], hyphenMatch[2]];
    }

    return [];
  }

  private sanitizeToAlphaNumeric(text: string): string {
    let sanitized = '';
    for (const char of text) {
      sanitized += /[a-zA-Z0-9]/.test(char) ? char.toUpperCase() : ' ';
    }
    return sanitized.trim().replace(/\s+/g, ' ');
  }

  private getComponentsFromSanitizedString(text: string): string[] {
    const componentPattern = /^[A-Z]+\d+$/;
    const rawComponents = text.split(' ').filter(item => componentPattern.test(item));
    return rawComponents.map(item => this.prefixRemover.clean(item));
  }
}

export const traceabilityParser = new TraceabilityFailsParser();