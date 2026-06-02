import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { X, FileText, Download, Loader2 } from 'lucide-react';

const PdfPreviewModal = ({ 
  isOpen, 
  onClose, 
  canvasSnapshot, // Base64 or canvas or image url
  bodyShape, 
  sizeRecommend, 
  occasion, 
  outfitItems, 
  adviceText 
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  // Calculate total price of active outfit
  const items = Object.entries(outfitItems).filter(([_, item]) => item !== null);
  const totalPrice = items.reduce((sum, [_, item]) => sum + (item.price || 0), 0);

  // Core jsPDF compile pipeline
  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Branding Colors (Deep Charcoal, Gold, Soft Gray, Rose accent)
      const primaryColor = [10, 11, 13];    // Deep charcoal (#0a0b0d)
      const accentColor = [212, 175, 55];    // Gold (#d4af37)
      const accentRose = [233, 95, 118];    // Rose (#e95f76)
      const textColor = [50, 50, 50];       // Charcoal (#323232)
      const textLightColor = [120, 120, 120]; // Light gray

      // 1. Header Banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, 'F');

      // Gold Accent strip
      doc.setFillColor(...accentColor);
      doc.rect(0, 35, 210, 2, 'F');

      // Title & Logo
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('FITSTYLE AI', 15, 18);
      
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('Your Personal Intelligent Styling Assistant', 15, 24);

      // Date
      doc.setTextColor(...accentColor);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      doc.text(currentDate, 195, 18, { align: 'right' });

      // 2. Summary Grid Section
      doc.setTextColor(...primaryColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('STYLING PROFILE', 15, 50);

      // Divider line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(15, 53, 195, 53);

      // Proportions details labels
      doc.setTextColor(...textColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('SILHOUETTE PROFILE', 15, 61);
      doc.text('RECOMMENDED SIZE', 75, 61);
      doc.text('OCCASION TARGET', 135, 61);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Body Shape: ${bodyShape}`, 15, 68);
      doc.text(`EU Letter: ${sizeRecommend?.letter || 'M'} (${sizeRecommend?.numeric || 38})`, 75, 68);
      doc.text(`${occasion}`, 135, 68);

      doc.line(15, 73, 195, 73);

      // 3. Main Try-On Image (Left) and Outfit Items List (Right)
      const imageWidth = 55;
      const imageHeight = 73;
      const imageX = 15;
      const imageY = 80;

      // Draw border frame for try-on image
      doc.setDrawColor(...accentColor);
      doc.setLineWidth(0.5);
      doc.rect(imageX - 1, imageY - 1, imageWidth + 2, imageHeight + 2, 'S');

      // Add Try-On Image safely
      if (canvasSnapshot) {
        try {
          if (canvasSnapshot.startsWith('data:image')) {
            // Base64 image
            doc.addImage(canvasSnapshot, 'JPEG', imageX, imageY, imageWidth, imageHeight);
          } else {
            // Remote URL: Draw mock placeholder box, but try loading it
            // To prevent blocking, we can load it onto a temporary canvas
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = canvasSnapshot;
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              // Timeout after 3 seconds
              setTimeout(resolve, 3000);
            });
            
            if (img.complete && img.naturalWidth > 0) {
              doc.addImage(img, 'JPEG', imageX, imageY, imageWidth, imageHeight);
            } else {
              throw new Error('Image load timeout');
            }
          }
        } catch (e) {
          console.warn('[PDF export] Failed to load image, using fallback box:', e);
          doc.setFillColor(240, 240, 240);
          doc.rect(imageX, imageY, imageWidth, imageHeight, 'F');
          doc.setTextColor(...textLightColor);
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(8);
          doc.text('Try-On Visual Preview', imageX + (imageWidth / 2), imageY + (imageHeight / 2) - 3, { align: 'center' });
          doc.text('(Check app dashboard)', imageX + (imageWidth / 2), imageY + (imageHeight / 2) + 2, { align: 'center' });
        }
      } else {
        // No image uploaded fallback
        doc.setFillColor(240, 240, 240);
        doc.rect(imageX, imageY, imageWidth, imageHeight, 'F');
        doc.setTextColor(...textLightColor);
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('No Profile Image', imageX + (imageWidth / 2), imageY + (imageHeight / 2) - 2, { align: 'center' });
      }

      // Outfit Items Table
      const tableX = 78;
      const tableY = 80;
      const tableWidth = 117;

      doc.setTextColor(...primaryColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SELECTED GARMENTS', tableX, tableY);

      // Draw table headers
      const headerY = tableY + 5;
      doc.setFillColor(245, 245, 245);
      doc.rect(tableX, headerY, tableWidth, 6, 'F');
      
      doc.setTextColor(...textColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Category', tableX + 3, headerY + 4);
      doc.text('Garment Name', tableX + 25, headerY + 4);
      doc.text('Price', tableX + tableWidth - 3, headerY + 4, { align: 'right' });

      // Rows
      let currentY = headerY + 6;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);

      if (items.length === 0) {
        doc.setTextColor(...textLightColor);
        doc.text('No items selected in this outfit.', tableX + 3, currentY + 6);
        currentY += 10;
      } else {
        items.forEach(([cat, item]) => {
          doc.setDrawColor(240, 240, 240);
          doc.line(tableX, currentY + 8, tableX + tableWidth, currentY + 8);

          doc.setTextColor(...accentRose);
          doc.setFont('Helvetica', 'bold');
          doc.text(cat, tableX + 3, currentY + 5);

          doc.setTextColor(...textColor);
          doc.setFont('Helvetica', 'normal');
          
          let displayName = item.name || '';
          if (displayName.length > 32) displayName = displayName.substring(0, 30) + '...';
          doc.text(displayName, tableX + 25, currentY + 5);

          doc.text(`$${parseFloat(item.price).toFixed(2)}`, tableX + tableWidth - 3, currentY + 5, { align: 'right' });
          
          currentY += 8;
        });
      }

      // Draw total price row
      doc.setFillColor(252, 248, 235);
      doc.rect(tableX, currentY + 2, tableWidth, 8, 'F');
      doc.setDrawColor(...accentColor);
      doc.line(tableX, currentY + 2, tableX + tableWidth, currentY + 2);
      doc.line(tableX, currentY + 10, tableX + tableWidth, currentY + 10);

      doc.setTextColor(...primaryColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Total Outfit Cost', tableX + 3, currentY + 7);
      doc.text(`$${totalPrice.toFixed(2)}`, tableX + tableWidth - 3, currentY + 7, { align: 'right' });

      // 4. Gemini/Groq Styling Advice Paragraph box
      const adviceY = 162;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(230, 230, 230);
      doc.rect(15, adviceY, 180, 48, 'F');
      
      // Vertical gold accent highlight stripe
      doc.setFillColor(...accentColor);
      doc.rect(15, adviceY, 1.5, 48, 'F');

      doc.setTextColor(...accentColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('STYLING ADVICE & RATIONALE', 20, adviceY + 6);

      doc.setTextColor(...textColor);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      
      const textLines = doc.splitTextToSize(adviceText || 'No styling advice generated.', 170);
      doc.text(textLines, 20, adviceY + 13);

      // 5. Boutique Hours & Store Footer Info
      const footerY = 217;
      doc.setDrawColor(220, 220, 220);
      doc.line(15, footerY, 195, footerY);

      doc.setTextColor(...primaryColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('VISIT US FOR IN-STORE FITTING & SWAPS', 15, footerY + 7);

      doc.setTextColor(...textColor);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      
      doc.text('Boutique: FitStyle AI Luxe Boutique', 15, footerY + 14);
      doc.text('Address: 123 Chic Avenue, Fashion District, NY 10001', 15, footerY + 19);
      doc.text('Contact: +1 (555) 348-7895', 15, footerY + 24);

      doc.text('Hours: Mon-Sat: 10:00 AM - 8:00 PM', 115, footerY + 14);
      doc.text('Show this printed report or mobile version in-store.', 115, footerY + 19);
      doc.text('Our team will locate items and verify matching sizing instantly.', 115, footerY + 24);

      // Dark footer accent border
      doc.setFillColor(...primaryColor);
      doc.rect(0, 290, 210, 7, 'F');

      // Trigger download
      const filename = `FitStyle_AI_Styling_${occasion.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error('[PDF Export] Generation failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1013] border border-dark-border max-w-2xl w-full rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-outfit font-bold text-white">Styling Report Preview</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-inter text-sm text-dark-muted">
          <div className="border border-dark-border rounded-xl bg-dark-bg p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-dark-border pb-3">
              <div>
                <h4 className="text-white font-outfit font-bold text-lg">FitStyle AI Styling Invoice</h4>
                <p className="text-xs mt-1 text-dark-muted">Fit Profile Summary</p>
              </div>
              <span className="text-xs text-gold font-semibold">{currentDate}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs font-semibold uppercase tracking-wider text-dark-muted border-b border-dark-border pb-3">
              <div>
                <span className="text-[10px] block mb-1">Body Silhouette</span>
                <span className="text-white font-bold text-sm font-outfit">{bodyShape}</span>
              </div>
              <div>
                <span className="text-[10px] block mb-1">Estimated Size</span>
                <span className="text-white font-bold text-sm font-outfit">EU {sizeRecommend?.letter} ({sizeRecommend?.numeric})</span>
              </div>
              <div>
                <span className="text-[10px] block mb-1">Occasion Code</span>
                <span className="text-white font-bold text-sm font-outfit">{occasion}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider block">Outfit Garments</span>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-dark-muted border-b border-dark-border/60 text-left">
                    <th className="pb-1.5 font-semibold">Category</th>
                    <th className="pb-1.5 font-semibold">Garment Name</th>
                    <th className="pb-1.5 font-semibold text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(([cat, item]) => (
                    <tr key={cat} className="text-white border-b border-dark-border/30">
                      <td className="py-2 text-rose font-bold">{cat}</td>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-right">${parseFloat(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold text-sm bg-white/5">
                    <td colSpan="2" className="py-2.5 px-2 text-white">Total Cost</td>
                    <td className="py-2.5 px-2 text-right text-gold">${totalPrice.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#131518]/70 border border-dark-border p-4 rounded-xl space-y-1">
              <span className="text-xs text-gold font-bold uppercase tracking-wider block">AI Stylist Advice</span>
              <p className="text-xs leading-relaxed text-white font-normal">{adviceText || 'Generating...'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-dark-border bg-dark-bg/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="glass-panel border-dark-border hover:bg-white/5 text-white font-semibold py-2 px-5 rounded-xl transition-all font-outfit text-sm"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="bg-gold hover:bg-gold-hover text-black font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg font-outfit text-sm flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
