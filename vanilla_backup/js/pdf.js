// js/pdf.js
// Handles client-side PDF generation using jsPDF

const PDFService = (() => {

  async function generateAndDownloadPDF(canvasSnapshot, analysis, sizeRecommend, occasion, outfitItems, adviceText) {
    if (!window.jspdf) {
      throw new Error("jsPDF library not loaded");
    }

    const { jsPDF } = window.jspdf;
    
    // Create portrait PDF (A4 size: 210mm x 297mm)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const store = window.FitStyleConfig;

    // --- Elegant Brand Styling ---
    const primaryColor = [10, 11, 13];    // Deep charcoal (#0a0b0d)
    const accentColor = [212, 175, 55];    // Gold (#d4af37)
    const accentRose = [233, 95, 118];    // Rose (#e95f76)
    const textColor = [50, 50, 50];       // Muted charcoal (#323232)
    const textLightColor = [120, 120, 120]; // Light gray

    // 1. Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, "F");

    // Gold Accent bar
    doc.setFillColor(...accentColor);
    doc.rect(0, 35, 210, 2, "F");

    // Title & Logo
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FITSTYLE AI", 15, 18);
    
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(10);
    doc.text("A Smart Fashion Assistant for Online Clothing Shoppers", 15, 24);

    // Date
    doc.setTextColor(...accentColor);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(currentDate, 195, 18, { align: "right" });

    // 2. Summary Details Columns (Grid)
    doc.setTextColor(...primaryColor);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("STYLING SUMMARY", 15, 50);

    // Horizontal thin rule
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(15, 53, 195, 53);

    // Proportions details
    doc.setTextColor(...textColor);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("SILHOUETTE PROFILE", 15, 61);
    doc.text("ESTIMATED SIZE", 75, 61);
    doc.text("OCCASION TARGET", 135, 61);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Body Shape: ${analysis.shape.shape}`, 15, 68);
    doc.text(`Letter: ${sizeRecommend.letter}  (EU ${sizeRecommend.numeric})`, 75, 68);
    doc.text(`${occasion}`, 135, 68);

    doc.line(15, 73, 195, 73);

    // 3. Main Try-On Image & Items Grid
    let imageWidth = 55;
    let imageHeight = 73;
    let imageX = 15;
    let imageY = 80;

    // Draw frame around try-on image
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.rect(imageX - 1, imageY - 1, imageWidth + 2, imageHeight + 2, "S");

    // Add User Try-On Snapshot Image
    try {
      // Capture Try-On canvas image data
      let imgData = canvasSnapshot;
      if (typeof canvasSnapshot === "object" && canvasSnapshot.toDataURL) {
        imgData = canvasSnapshot.toDataURL("image/jpeg", 0.95);
      }
      doc.addImage(imgData, "JPEG", imageX, imageY, imageWidth, imageHeight);
    } catch (e) {
      console.warn("Failed to add try-on image to PDF. Proceeding with placeholder box.", e);
      doc.setFillColor(240, 240, 240);
      doc.rect(imageX, imageY, imageWidth, imageHeight, "F");
      doc.setTextColor(...textLightColor);
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Try-On Preview\nUnavailable", imageX + (imageWidth/2), imageY + (imageHeight/2) - 4, { align: "center" });
    }

    // Outfit Items Table List on right column
    let tableX = 78;
    let tableY = 80;
    let tableWidth = 117;

    doc.setTextColor(...primaryColor);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SELECTED GARMENTS", tableX, tableY);

    // Draw table headers
    let headerY = tableY + 5;
    doc.setFillColor(245, 245, 245);
    doc.rect(tableX, headerY, tableWidth, 6, "F");
    
    doc.setTextColor(...textColor);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Category", tableX + 3, headerY + 4);
    doc.text("Garment Name", tableX + 25, headerY + 4);
    doc.text("Price", tableX + tableWidth - 3, headerY + 4, { align: "right" });

    // Table rows
    let currentY = headerY + 6;
    let totalPrice = 0;
    
    const items = Object.entries(outfitItems).filter(([_, item]) => item !== null);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);

    if (items.length === 0) {
      doc.setTextColor(...textLightColor);
      doc.text("No items selected in this outfit.", tableX + 3, currentY + 6);
      currentY += 10;
    } else {
      items.forEach(([cat, item]) => {
        doc.setDrawColor(240, 240, 240);
        doc.line(tableX, currentY + 8, tableX + tableWidth, currentY + 8);

        doc.setTextColor(...accentRose);
        doc.setFont("Helvetica", "bold");
        doc.text(cat, tableX + 3, currentY + 5);

        doc.setTextColor(...textColor);
        doc.setFont("Helvetica", "normal");
        
        // Truncate name if it's too long
        let displayName = item.name;
        if (displayName.length > 32) displayName = displayName.substring(0, 30) + "...";
        doc.text(displayName, tableX + 25, currentY + 5);

        doc.text(`$${item.price.toFixed(2)}`, tableX + tableWidth - 3, currentY + 5, { align: "right" });
        
        totalPrice += item.price;
        currentY += 8;
      });
    }

    // Draw total row
    doc.setFillColor(252, 248, 235);
    doc.rect(tableX, currentY + 2, tableWidth, 8, "F");
    doc.setDrawColor(...accentColor);
    doc.line(tableX, currentY + 2, tableX + tableWidth, currentY + 2);
    doc.line(tableX, currentY + 10, tableX + tableWidth, currentY + 10);

    doc.setTextColor(...primaryColor);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Total", tableX + 3, currentY + 7);
    doc.text(`$${totalPrice.toFixed(2)}`, tableX + tableWidth - 3, currentY + 7, { align: "right" });

    // 4. Gemini Styling Advice Box
    let adviceY = 162;
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(230, 230, 230);
    doc.rect(15, adviceY, 180, 48, "F");
    
    // Left vertical accent stripe
    doc.setFillColor(...accentColor);
    doc.rect(15, adviceY, 1.5, 48, "F");

    doc.setTextColor(...accentColor);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("STYLING ADVICE & RATIONALE", 20, adviceY + 6);

    doc.setTextColor(...textColor);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    
    // Wrap paragraph text
    const textLines = doc.splitTextToSize(adviceText || "No styling rationale generated.", 170);
    doc.text(textLines, 20, adviceY + 13);

    // 5. Store Address & Details Footer Block
    let footerY = 217;
    doc.setDrawColor(220, 220, 220);
    doc.line(15, footerY, 195, footerY);

    doc.setTextColor(...primaryColor);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("VISIT US FOR IN-STORE FITTING", 15, footerY + 7);

    doc.setTextColor(...textColor);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    
    doc.text(`Boutique: ${store.storeName}`, 15, footerY + 14);
    doc.text(`Address: ${store.storeAddress}`, 15, footerY + 19);
    doc.text(`Contact: ${store.storeContact}`, 15, footerY + 24);

    doc.text(`Hours: ${store.storeHours}`, 115, footerY + 14);
    doc.text("Bring this printed summary or show it on your mobile device", 115, footerY + 19);
    doc.text("in-store to locate items quickly and confirm sizing availability.", 115, footerY + 24);

    // Bottom dark line
    doc.setFillColor(...primaryColor);
    doc.rect(0, 290, 210, 7, "F");

    // Save/Download PDF
    const filename = `FitStyle_AI_Styling_${occasion.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    
    return true;
  }

  return {
    generateAndDownloadPDF
  };
})();

// Export globally
window.PDFService = PDFService;
