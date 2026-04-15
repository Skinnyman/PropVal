import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, ImageRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';

const createSectionHeader = (text) => {
    return new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 600 },
    });
};

const createSubHeader = (text) => {
    return new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
    });
};

const createKeyValue = (key, value) => {
    return new Paragraph({
        children: [
            new TextRun({ text: `${key}: `, bold: true }),
            new TextRun({ text: value ? value.toString() : 'N/A' }),
        ],
        spacing: { after: 200 }
    });
};

const createParagraph = (text, isBold = false) => {
    return new Paragraph({
        children: [new TextRun({ text: text, bold: isBold })],
        spacing: { after: 300, line: 360 } // 1.5 line spacing
    });
};

const createPageBreak = () => new Paragraph({ children: [new PageBreak()] });

   export const generateWordReport = async (valuation, details, base64Images = []) => {
    // Convert base64 strings back to Uint8Array for docx
    const imagesBuffers = base64Images.map(b64 => {
        try {
            const base64Data = b64.replace(/^data:image\/\w+;base64,/, "");
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        } catch (e) {
            console.error("Error converting base64 to buffer for DOCX", e);
            return null;
        }
    });

    const validImages = imagesBuffers.filter(buf => buf !== null);
    
    // Create paragraphs for images
    const imageParagraphs = validImages.length > 0 
        ? validImages.map(buffer => new Paragraph({
            children: [
                new ImageRun({
                    data: buffer,
                    transformation: {
                        width: 500,
                        height: 350,
                    },
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }))
        : [new Paragraph({ text: '(No photographs are currently attached to this valuation record.)', alignment: AlignmentType.CENTER, italics: true })];

    const doc = new Document({
        creator: 'PropVal Platform',
        title: `Valuation Report - ${valuation.subjectProperty?.suburb || 'Property'}`,
        description: 'Professional Valuation Report',
        sections: [{
            properties: {},
            children: [
                // TITLE PAGE
                new Paragraph({
                    text: 'VALUATION REPORT',
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 2000, after: 1000 },
                }),
                new Paragraph({
                    text: 'Private & Confidential',
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 3000 },
                }),
                new Paragraph({
                    text: `Subject Property: ${valuation.subjectProperty?.suburb}, ${valuation.subjectProperty?.district}`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Date of Valuation: ${details.dateOfValuation}`, bold: true })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 3000 },
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Report ID: ${valuation._id.substring(valuation._id.length - 8).toUpperCase()}`, bold: true })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 3000 },
                }),
                createPageBreak(),

                // TABLE OF CONTENTS (Static mapping)
                createSectionHeader('TABLE OF CONTENTS'),
                new Paragraph({ text: 'PICTURES...........................................................................3' }),
                new Paragraph({ text: 'LETTER OF TRANSMITTAL......................................................4' }),
                new Paragraph({ text: 'INTRODUCTION/SUMMARY OF KEY DATA...............................6' }),
                new Paragraph({ text: 'CHAPTER TWO: BRIEF PROFILE OF CITY, LOCATION.......8' }),
                new Paragraph({ text: 'CHAPTER THREE: VALUATION PROCESS / METHODOLOGY.......14' }),
                new Paragraph({ text: 'CHAPTER FOUR: VALUATION CALCULATION BREAKDOWN.......16' }),
                new Paragraph({ text: 'VALUATION CERTIFICATION.................................................18' }),
                new Paragraph({ text: 'APPENDICES.........................................................................20' }),
                createPageBreak(),

                // PICTURES
                createSectionHeader('PICTURES'),
                ...imageParagraphs,
                createPageBreak(),

                // LETTER OF TRANSMITTAL
                createSectionHeader('LETTER OF TRANSMITTAL'),
                new Paragraph({ text: `Date: ${new Date().toLocaleDateString('en-GB')}` }),
                new Paragraph({ text: details.clientName, bold: true, spacing: { before: 400 } }),
                new Paragraph({ text: details.clientAddress, spacing: { after: 400 } }),
                new Paragraph({ text: `Dear Sir/Madam,` }),
                new Paragraph({ text: `VALUATION OF PROPERTY AT ${valuation.subjectProperty?.suburb?.toUpperCase()}`, bold: true, spacing: { before: 300, after: 300 } }),
                createParagraph(`In accordance with your written instructions, we have attended the above-mentioned real estate asset and carried out the necessary inspections, investigations, and analysis to ascertain its Open Market Value. The assessment was undertaken strictly for ${details.purpose.toLowerCase()} purposes.`),
                createParagraph(`We have pleasure in submitting this comprehensive report, which details our methodology, our findings regarding the statutory and physical nature of the property, and our final professional opinion of value. We certify that we have acted as independent valuers and that the assessment accurately reflects the current market dynamics in the subject locality.`),
                new Paragraph({ text: 'Yours faithfully,', spacing: { before: 400, after: 800 } }),
                new Paragraph({ text: details.name, bold: true }),
                new Paragraph({ text: details.firm }),
                createPageBreak(),

                // INTRODUCTION/SUMMARY OF KEY DATA
                createSectionHeader('INTRODUCTION / SUMMARY OF KEY DATA'),
                createParagraph('Request for Valuation', true),
                createParagraph(`This valuation exercise was commissioned by ${details.clientName}. Our mandate is to determine the Open Market Value and Forced Sale Value of the subject property to guide critical decision-making regarding the asset.`),
                
                createParagraph('Nature of Assets', true),
                createParagraph(`The subject asset comprises a high-end residential dwelling structure. It exhibits modern architectural design, built of solid sandcrete blockwork with reinforced concrete columns, and is situated within a well-defined, secure walled compound.`),
                
                createParagraph('Purpose of Valuation', true),
                createParagraph(`The primary objective of this report is to provide a professional opinion of the Open Market Value of the legal interest in the property. This valuation is specifically rendered for ${details.purpose} purposes, evaluating the asset's overall financial suitability.`),
                
                createKeyValue('Property Digital Address', details.digitalAddress || 'N/A'),
                createKeyValue('Date of Inspection', details.dateOfInspection),
                createKeyValue('Date of Valuation', details.dateOfValuation),
                createKeyValue('Total Land Area Under Consideration', `${valuation.subjectProperty?.landSize} sqm`),
                createKeyValue('Basis of Valuation', 'Open Market Value'),
                createKeyValue('Title Particulars / Legal Interest', details.titleParticulars),
                createPageBreak(),

                // CHAPTER TWO
                createSectionHeader('CHAPTER TWO'),
                createSubHeader('BRIEF PROFILE OF CITY, LOCATION & PROPERTY DETAILS'),
                createParagraph('Location of Property', true),
                createParagraph(`The subject property is located within ${valuation.subjectProperty?.suburb}, a prominent district situated within the ${valuation.subjectProperty?.district} of the ${valuation.subjectProperty?.region}. Geographically, it enjoys proximity to major arterial roads and commercial landmarks.`),
                
                createParagraph('Neighbourhood Data', true),
                createParagraph(`${details.neighbourhoodData} The area benefits from a comprehensive array of civic and infrastructural amenities, including a tarred road network adorned with functional street lighting, a reliable connection to the national electricity grid, and treated water supply. The socio-economic profile of the locality features a vibrant secondary real estate market characterized by robust demand dynamics.`),
                
                createParagraph('Property Description', true),
                createParagraph(`The subject property comprises a ${valuation.subjectProperty?.condition?.toLowerCase()} condition ${valuation.subjectProperty?.propertyType}. It has a total floor size of ${valuation.subjectProperty?.size} sqm. The external walls are rendered and finished with high-grade acrylic emulsion paint. Internally, the accommodation is generously proportioned. The floors throughout the main living areas are laid with polished porcelain tiles, while the ceilings are predominantly suspended plasterboard complete with recessed fixtures.`),
                createPageBreak(),

                // CHAPTER THREE
                createSectionHeader('CHAPTER THREE'),
                createSubHeader('VALUATION PROCESS / METHODOLOGY'),
                createParagraph('Basis of Valuation', true),
                createParagraph(`As previously established, the primary basis of this valuation is the Open Market Value. This fundamental metric relies on the premise of the highest and best use of the property. The assessment fundamentally represents the estimated amount for which the property should exchange on the date of valuation between a willing buyer and a willing seller in an arm's-length transaction, after proper marketing, wherein the parties had each acted knowledgeably, prudently, and without compulsion. We have also considered the Forced Sale Value, which reflects the probable realizable price in circumstances where the vendor is compelled to sell within a heavily restricted timeframe.`),
                
                createParagraph('Methods of Valuation', true),
                createParagraph(`Standard valuation practices recognize several distinct methodologies, primarily the Investment (Income Capitalization) Method, the Depreciated Replacement Cost Method, and the Market Comparison Approach. The Investment Method is reserved for income-generating assets. The Depreciated Replacement Cost Method calculates the current cost of reproducing the existing structures, less appropriate allowances. The Market Comparison Approach involves the direct analysis of recent transactional evidence of highly comparable properties.`),
                
                createParagraph('Valuation Method Adopted', true),
                createParagraph(`The valuation of this asset has been executed strictly employing the ${valuation.method} Approach. This methodology was deemed the most robust and accurate given the specific nature and operational dynamics surrounding the property. Raw market data was meticulously adjusted to account for slight dissimilarities between comparables and the subject property. Positive and negative quantitative adjustments were applied for variables including exact location gradients, plot size, conditions, and architectural superiority to triangulate a highly accurate metric of value.`),
                createPageBreak(),

                // CHAPTER FOUR
                createSectionHeader('CHAPTER FOUR'),
                createSubHeader('VALUATION CALCULATION BREAKDOWN'),
                createParagraph(`The following details the specific mathematical application of the ${valuation.method} utilized to derive the final Open Market Value.`),
                
                ...(valuation.method === 'Income Capitalization' ? [
                    createParagraph('Income Capitalization Assessment', true),
                    ...(valuation.incomeData?.methodology === 'DCF' ? [
                       createParagraph(`Multi-Year Discounted Cash Flow (DCF) Analysis over ${valuation.incomeData.dcfProjections?.length} years.`),
                       new Table({
                           width: { size: 100, type: WidthType.PERCENTAGE },
                           rows: [
                               new TableRow({
                                   children: [
                                       new TableCell({ children: [new Paragraph({ text: 'Year', bold: true })], margins: { top: 100, bottom: 100, left: 100 } }),
                                       new TableCell({ children: [new Paragraph({ text: 'Gross Income (GHS)', bold: true })], margins: { top: 100, bottom: 100, left: 100 } }),
                                       new TableCell({ children: [new Paragraph({ text: 'Expenses (GHS)', bold: true })], margins: { top: 100, bottom: 100, left: 100 } }),
                                       new TableCell({ children: [new Paragraph({ text: 'NOI (GHS)', bold: true })], margins: { top: 100, bottom: 100, left: 100 } }),
                                       new TableCell({ children: [new Paragraph({ text: 'PV (GHS)', bold: true })], margins: { top: 100, bottom: 100, left: 100 } }),
                                   ]
                               }),
                               ...(valuation.incomeData?.dcfProjections?.map(proj => new TableRow({
                                   children: [
                                       new TableCell({ children: [new Paragraph({ text: proj.year.toString() })] }),
                                       new TableCell({ children: [new Paragraph({ text: proj.grossIncome.toLocaleString() })] }),
                                       new TableCell({ children: [new Paragraph({ text: proj.expenses.toLocaleString() })] }),
                                       new TableCell({ children: [new Paragraph({ text: proj.netOperatingIncome.toLocaleString() })] }),
                                       new TableCell({ children: [new Paragraph({ text: Math.round(proj.presentValue).toLocaleString() })] }),
                                   ]
                               })) || [])
                           ]
                       }),
                       new Paragraph({ text: ``, spacing: { before: 200 } }),
                       createKeyValue('Sum of PV of Cash Flows', `GHS ${Math.round(valuation.incomeData?.dcfProjections?.reduce((a, b) => a + (b.presentValue || 0), 0)).toLocaleString()}`),
                       createKeyValue('Terminal Value (Discounted)', `GHS ${Math.round(valuation.finalValue - (valuation.incomeData?.dcfProjections?.reduce((a, b) => a + (b.presentValue || 0), 0))).toLocaleString()}`),
                       createKeyValue('Total Present Value', `GHS ${valuation.finalValue.toLocaleString()}`),
                    ] : [
                       createParagraph(`Direct Capitalization Analysis`),
                       createKeyValue('Gross Rental Income', `GHS ${valuation.incomeData?.annualRentalIncome?.toLocaleString()}`),
                       createKeyValue(`Less Void/Vacancy (${valuation.incomeData?.vacancyRate}%)`, `- GHS ${((valuation.incomeData?.annualRentalIncome * valuation.incomeData?.vacancyRate) / 100).toLocaleString()}`),
                       createKeyValue('Less Operating Expenses', `- GHS ${valuation.incomeData?.operatingExpenses?.toLocaleString()}`),
                       createKeyValue('True Net Operating Income (NOI)', `GHS ${((valuation.incomeData?.annualRentalIncome * (1 - valuation.incomeData?.vacancyRate / 100)) - valuation.incomeData?.operatingExpenses).toLocaleString()}`),
                       createKeyValue('Capitalization Rate', `${valuation.incomeData?.capRate}%`),
                       createKeyValue('Market Value (NOI / Cap Rate)', `GHS ${valuation.finalValue?.toLocaleString()}`),
                    ])
                ] : []),

                ...(valuation.method === 'Comparable Sales' ? [
                    createParagraph('Sequential Market Adjustments', true),
                    createParagraph(`The adjustment matrix applied to ${valuation.adjustments?.length} comparable properties, using the Principle of Substitution.`),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: 'Ref', bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: 'Base Price', bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: 'Net Adjusted Price', bold: true })] }),
                                ]
                            }),
                            ...(valuation.adjustments?.map((adj, i) => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: `Comp ${i+1}` })] }),
                                    new TableCell({ children: [new Paragraph({ text: `GHS ${(adj.adjustedPrice - adj.netAdjustment).toLocaleString()}` })] }),
                                    new TableCell({ children: [new Paragraph({ text: `GHS ${Math.round(adj.adjustedPrice).toLocaleString()}` })] }),
                                ]
                            })) || [])
                        ]
                    }),
                    new Paragraph({ text: ``, spacing: { before: 200 } }),
                    createParagraph(`Weights applied mathematically against gross adjustment deviations to reconcile Open Market Value at GHS ${valuation.finalValue?.toLocaleString()}.`)
                ] : []),

                ...(valuation.method === 'Cost Method' ? [
                     createParagraph('Depreciated Replacement Cost Breakdown', true),
                     createKeyValue('Open Market Land Value', `GHS ${valuation.costData?.landValue?.toLocaleString()}`),
                     createKeyValue('Gross Replacement Costs', `GHS ${(Number(valuation.costData?.directCosts) + Number(valuation.costData?.indirectCosts)).toLocaleString()}`),
                     createParagraph('Less Depreciation (3-Tier Obsolescence)', true),
                     createKeyValue('Physical Depreciation (Age-Life)', `- GHS ${Math.round(valuation.costData?.depreciation?.physical || 0).toLocaleString()}`),
                     createKeyValue('Functional Obsolescence', `- GHS ${Math.round(valuation.costData?.depreciation?.functional || 0).toLocaleString()}`),
                     createKeyValue('External Obsolescence', `- GHS ${Math.round(valuation.costData?.depreciation?.external || 0).toLocaleString()}`),
                     createKeyValue('Total DRC Value', `GHS ${valuation.finalValue?.toLocaleString()}`)
                ] : []),

                ...(valuation.method === 'Residual Method' ? [
                     createParagraph('Residual Site Analysis', true),
                     createKeyValue('Gross Development Value (GDV)', `GHS ${valuation.residualData?.gdv?.toLocaleString()}`),
                     createParagraph('Less Development Costs & Margins', true),
                     createKeyValue('Hard Construction Costs', `- GHS ${Math.round(valuation.residualData?.constructionCosts || 0).toLocaleString()}`),
                     createKeyValue('Soft/Professional Fees', `- GHS ${Math.round(valuation.residualData?.professionalFees || 0).toLocaleString()}`),
                     createKeyValue(`S-Curve Finance Cost`, `- GHS ${Math.round(valuation.residualData?.financeCosts || 0).toLocaleString()}`),
                     createKeyValue(`Target Developer Profit`, `- GHS ${Math.round(valuation.residualData?.developerProfit || 0).toLocaleString()}`),
                     createKeyValue('Residual Land Value', `GHS ${valuation.finalValue?.toLocaleString()}`)
                ] : []),

                ...(valuation.method === 'Profit Method' ? [
                     createParagraph('Divisible Balance Assessment', true),
                     createKeyValue('Gross Annual Revenue', `GHS ${valuation.profitData?.grossAnnualRevenue?.toLocaleString()}`),
                     createKeyValue('Purchases / Cost of Goods', `- GHS ${valuation.profitData?.purchases?.toLocaleString()}`),
                     createKeyValue('Operating Expenses', `- GHS ${valuation.profitData?.operatingExpenses?.toLocaleString()}`),
                     createParagraph('Less Allowances', true),
                     createKeyValue(`Interest on Tenant Capital`, `- GHS ${Math.round((valuation.profitData?.tenantReturnRate/100) * (valuation.profitData?.tenantCapital || 0)).toLocaleString()}`),
                     createKeyValue(`Operator Remuneration`, `- GHS ${Math.round(valuation.profitData?.operatorRemuneration || 0).toLocaleString()}`),
                     createKeyValue(`Divisible Balance (True Rent)`, `GHS ${Math.max(0, (valuation.profitData?.grossAnnualRevenue - valuation.profitData?.purchases - valuation.profitData?.operatingExpenses) - ((valuation.profitData?.tenantReturnRate/100) * (valuation.profitData?.tenantCapital || 0)) - valuation.profitData?.operatorRemuneration).toLocaleString()}`),
                     createKeyValue(`Capitalization Yield`, `${valuation.profitData?.capitalizationYield}%`),
                     createKeyValue(`Total Market Value`, `GHS ${valuation.finalValue?.toLocaleString()}`)
                ] : []),

                createPageBreak(),

                // VALUATION CERTIFICATION
                createSectionHeader('VALUATION CERTIFICATION'),
                createParagraph(`Having undertaken a rigorous inspection of the property, analyzed the prevailing local economic conditions, and synthesized all relevant real estate market data, it is our considered professional opinion that the value of the unexpired legal interest in the property is formally stated as follows:`),
                
                new Paragraph({ text: `OPEN MARKET VALUE:`, bold: true, spacing: { before: 400 } }),
                new Paragraph({ text: `GHS ${valuation.finalValue?.toLocaleString()}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                
                new Paragraph({ text: `ESTIMATED FORCED SALE VALUE:`, bold: true, spacing: { before: 400 } }),
                new Paragraph({ text: `GHS ${(valuation.finalValue * 0.7)?.toLocaleString()}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 800 } }),
                
                createParagraph(`We certify that we have no present or prospective financial interest in the property evaluated, and our employment is in no way contingent upon arriving at a predetermined value. This report is valid solely for the stated purpose and is formally submitted for your adjudication.`),
                
                new Paragraph({ text: `Signed: ___________________________`, spacing: { before: 800 } }),
                new Paragraph({ text: details.name, bold: true, spacing: { before: 200 } }),
                new Paragraph({ text: details.firm }),
                createPageBreak(),

                // APPENDICES
                createSectionHeader('APPENDICES'),
                createParagraph('APPENDIX 1: SCHEDULE OF ACCOMMODATION', true),
                createParagraph(details.scheduleOfAccommodation || `Total Rooms: ${valuation.subjectProperty?.rooms}`),
                
                createParagraph('APPENDIX 2: SKETCH FLOOR PLANS', true),
                createParagraph('(Detailed architectural sketch plans denoting internal room dimensions and layout circulation are attached as a separate addendum to this document.)', false),
                
                createParagraph('APPENDIX 3: GOOGLE LOCATION MAP', true),
                createParagraph(`Coordinates: ${valuation.subjectProperty?.coordinates?.lat || 'N/A'}, ${valuation.subjectProperty?.coordinates?.lng || 'N/A'}`),
                
                createParagraph('APPENDIX 4: DIRECTIONS TO THE SUBJECT PROPERTY', true),
                createParagraph('(Specific visual directions and waypoints detailed in main appraisal map file.)', false),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Valuation_Report_${valuation.subjectProperty?.suburb?.replace(/\s+/g, '_')}.docx`);
    });
};
