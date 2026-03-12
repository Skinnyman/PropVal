const puppeteer = require('puppeteer');

const generateValuationReport = async (valuationData) => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // professional HTML template for the report
  const content = `
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; color: #1e293b; background: white; }
          .container { max-width: 800px; margin: auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid #3b82f6; padding-bottom: 30px; margin-bottom: 40px; }
          .header h1 { margin: 0; color: #0f172a; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; }
          .header p { margin: 5px 0 0 0; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; }
          .report-id { text-align: right; font-size: 12px; color: #94a3b8; }
          
          .grid { display: grid; grid-cols: 2; gap: 40px; margin-top: 30px; }
          .section { margin-bottom: 40px; }
          .section h2 { font-size: 18px; font-weight: 700; color: #0f172a; border-left: 4px solid #3b82f6; padding-left: 15px; margin-bottom: 20px; }
          
          .data-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
          .label { color: #64748b; font-weight: 500; font-size: 14px; }
          .value { color: #0f172a; font-weight: 700; font-size: 14px; text-align: right; }
          
          .main-value-card { background: #0f172a; color: white; padding: 40px; border-radius: 24px; text-align: center; margin: 40px 0; position: relative; overflow: hidden; }
          .main-value-card p { color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; font-size: 14px; margin-bottom: 15px; }
          .main-value-card h3 { font-size: 48px; margin: 0; color: #3b82f6; font-weight: 900; }
          
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.6; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(59, 130, 246, 0.05); font-weight: 900; z-index: -1; }
        </style>
      </head>
      <body>
        <div class="watermark">PROPVAL GH</div>
        <div class="container">
          <div class="header">
            <div>
              <p>Valuation Intelligence</p>
              <h1>Valuation Report</h1>
            </div>
            <div class="report-id">
              ID: ${valuationData._id}<br/>
              Date: ${new Date(valuationData.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div class="section">
              <h2>Subject Property</h2>
              <div class="data-row"><span class="label">Region</span><span class="value">${valuationData.subjectProperty.region}</span></div>
              <div class="data-row"><span class="label">District</span><span class="value">${valuationData.subjectProperty.district || 'N/A'}</span></div>
              <div class="data-row"><span class="label">Suburb</span><span class="value">${valuationData.subjectProperty.suburb}</span></div>
              <div class="data-row"><span class="label">Type</span><span class="value">${valuationData.subjectProperty.propertyType}</span></div>
              <div class="data-row"><span class="label">Year Built</span><span class="value">${valuationData.subjectProperty.yearBuilt || 'N/A'}</span></div>
              <div class="data-row"><span class="label">Condition</span><span class="value">${valuationData.subjectProperty.condition || 'N/A'}</span></div>
            </div>

            <div class="section">
              <h2>Specifications</h2>
              <div class="data-row"><span class="label">Building Size</span><span class="value">${valuationData.subjectProperty.size || 'N/A'} sqm</span></div>
              <div class="data-row"><span class="label">Land Size</span><span class="value">${valuationData.subjectProperty.landSize || 'N/A'}</span></div>
              <div class="data-row"><span class="label">Rooms/Units</span><span class="value">${valuationData.subjectProperty.rooms || 'N/A'}</span></div>
              <div class="data-row"><span class="label">Method</span><span class="value">${valuationData.method}</span></div>
            </div>
          </div>

          ${valuationData.method === 'Comparable Sales' && valuationData.comparables?.length > 0 ? `
            <div class="section">
              <h2>Market Evidence (Comparable Sales)</h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr style="background: #f8fafc; text-align: left; font-size: 11px; color: #64748b; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 12px;">Location</th>
                    <th style="padding: 12px;">Type</th>
                    <th style="padding: 12px;">Size</th>
                    <th style="padding: 12px; text-align: right;">Sale Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${valuationData.comparables.map(comp => `
                    <tr style="font-size: 11px; border-bottom: 1px solid #f1f5f9; color: #334155;">
                      <td style="padding: 12px;">${comp.location?.suburb}, ${comp.location?.region}</td>
                      <td style="padding: 12px;">${comp.propertyInfo?.propertyType}</td>
                      <td style="padding: 12px;">${comp.propertyInfo?.size} sqm</td>
                      <td style="padding: 12px; font-weight: 700; text-align: right;">GHS ${comp.marketData?.salePrice?.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${valuationData.method === 'Income Capitalization' && valuationData.incomeData ? `
            <div class="section">
              <h2>Income Analysis Details</h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; background: #f8fafc; padding: 25px; border-radius: 16px;">
                <div>
                  <div class="data-row"><span class="label">Gross Annual Rent</span><span class="value">GHS ${valuationData.incomeData.annualRentalIncome?.toLocaleString()}</span></div>
                  <div class="data-row"><span class="label">Vacancy Rate (%)</span><span class="value">${valuationData.incomeData.vacancyRate}%</span></div>
                  <div class="data-row"><span class="label">Operating Expenses</span><span class="value">GHS ${valuationData.incomeData.operatingExpenses?.toLocaleString()}</span></div>
                </div>
                <div>
                  <div class="data-row"><span class="label">Net Operating Income</span><span class="value" style="color: #059669;">GHS ${(valuationData.incomeData.annualRentalIncome * (1 - valuationData.incomeData.vacancyRate/100) - valuationData.incomeData.operatingExpenses).toLocaleString()}</span></div>
                  <div class="data-row"><span class="label">Capitalization Rate</span><span class="value">${valuationData.incomeData.capRate}%</span></div>
                </div>
              </div>
            </div>
          ` : ''}

          ${valuationData.method === 'Cost Method' && valuationData.costData ? `
            <div class="section">
              <h2>Replacement Cost Analysis</h2>
              <div style="background: #f8fafc; padding: 25px; border-radius: 16px;">
                <div class="data-row"><span class="label">Land Market Value</span><span class="value">GHS ${valuationData.costData.landValue?.toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Replacement Cost (GFA: ${valuationData.subjectProperty.size} sqm @ GHS ${valuationData.costData.constructionCostPerSqm}/sqm)</span><span class="value">GHS ${(valuationData.costData.constructionCostPerSqm * valuationData.subjectProperty.size).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Accrued Depreciation</span><span class="value" style="color: #dc2626;">- GHS ${valuationData.costData.depreciation?.toLocaleString()}</span></div>
              </div>
            </div>
          ` : ''}

          ${valuationData.method === 'Residual Method' && valuationData.residualData ? `
            <div class="section">
              <h2>Residual Development Analysis</h2>
              <div style="background: #f8fafc; padding: 25px; border-radius: 16px;">
                <div class="data-row"><span class="label">Gross Development Value (GDV)</span><span class="value">GHS ${valuationData.residualData.gdv?.toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Const. & Professional Costs</span><span class="value">- GHS ${(Number(valuationData.residualData.constructionCosts) + Number(valuationData.residualData.professionalFees)).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Required Developer's Profit</span><span class="value">- GHS ${valuationData.residualData.developerProfit?.toLocaleString()}</span></div>
              </div>
            </div>
          ` : ''}

          ${valuationData.method === 'Profit Method' && valuationData.profitData ? `
            <div class="section">
              <h2>Profit Method Computation</h2>
              <div style="background: #f8fafc; padding: 25px; border-radius: 16px;">
                <div class="data-row"><span class="label">Enterprise Net Profit</span><span class="value">GHS ${(valuationData.profitData.grossAnnualRevenue - valuationData.profitData.operatingExpenses).toLocaleString()}</span></div>
                <div class="data-row"><span class="label">Capitalization Yield</span><span class="value">${valuationData.profitData.capitalizationYield}%</span></div>
              </div>
            </div>
          ` : ''}

          <div class="main-value-card">
            <p>Estimated Market Value</p>
            <h3>GHS ${valuationData.finalValue?.toLocaleString()}</h3>
          </div>

          <div class="footer">
            <p><strong>Disclaimer:</strong> This valuation is an estimate generated by the PropVal GH platform using ${valuationData.method} methodology. It is intended for professional guidance and should be verified by a licensed valuer before use in legal or financial transactions.</p>
            <p>&copy; ${new Date().getFullYear()} PropVal GH - Property Valuation Intelligence Platform for Ghana.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(content);
  const pdfBuffer = await page.pdf({ format: 'A4' });

  await browser.close();
  return pdfBuffer;
};

module.exports = { generateValuationReport };
