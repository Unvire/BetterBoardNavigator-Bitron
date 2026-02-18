class PartNumberPDFExtractor {
    constructor() {
      this.pnDict = {};
    }

    async getPartNumbers(file) {
        this.pnDict = {};
        const text = await this._extractTextFromPDF(file);
        this.pnDict = this._searchComponentsData(text);
        
        return this.pnDict;
    }

    getPartNumberOfComponent(componentName) {
        if (!(componentName in this.pnDict)) {
            return "";
        }
        return this.pnDict[componentName].partNumber;
    }

    async _extractTextFromPDF(file) {
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            const pageText = content.items.map(item => item.str).join('\n');
            fullText += pageText + "\n";
        }

        return fullText
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }

    _searchComponentsData(text) {
        const pnDict = {};

        let i = 0;
        while (i < text.length) {
            const isTableHeader =
                text[i]?.toLowerCase() === 'refdes' &&
                text[i - 1]?.toLowerCase() === 'quantity' &&
                text[i - 2]?.toLowerCase() === 'description' &&
                text[i - 3]?.toLowerCase() === 'ipn';

            i++;

            if (!isTableHeader){
              continue
            };

            while (/^\d{8}$/.test(text[i])) {
                const bitronCode = text[i];
                const description = text[i + 1];
                let components = text[i + 3];

                i += 4;
                while (text[i]?.includes(',')) {
                    components += text[i];
                    i++;
                }

                this._updatePartNumberDictInPlace(pnDict, components, bitronCode, description);
            }
        }

        return pnDict;
    }

    _updatePartNumberDictInPlace(pnDict, components, bitronCode, description) {
        const componentsList = components
            .split(',')
            .map(c => c.trim());

        for (const component of componentsList) {
            pnDict[component] = {
                partNumber: bitronCode,
                description: description
            };
        }
    }
}