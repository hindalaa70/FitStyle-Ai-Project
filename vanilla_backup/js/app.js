// js/app.js
// Main UI Coordinator and Application State Controller

document.addEventListener("DOMContentLoaded", () => {
  // --- APPLICATION STATE ---
  const state = {
    currentUser: null,
    currentScreen: "auth", // auth, upload, recommend, admin
    uploadedImage: null,   // Base64 or Image Element
    uploadedImageFile: null,
    analysisResult: null,  // MediaPipe results (measurements, shape, landmarks)
    selectedOccasion: null,
    currentOutfit: {
      Top: null,
      Bottom: null,
      Footwear: null,
      Accessory: null
    },
    catalogue: [],
    activeSwapCategory: null, // Top, Bottom, etc.
    activeEditingProduct: null // For Admin Edit mode
  };

  // --- SAFE ICON RENDERER FALLBACK ---
  function safeCreateIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    } else {
      console.warn("Lucide Icons is unavailable. Using text indicators.");
    }
  }

  // --- UI ELEMENTS ---
  const DOM = {
    // Headers & Nav
    header: document.getElementById("main-header"),
    btnSignout: document.getElementById("btn-signout"),
    btnGoAdmin: document.getElementById("btn-go-admin"),
    btnGoShopper: document.getElementById("btn-go-shopper"),
    btnGoSettings: document.getElementById("btn-go-settings"),
    userBadge: document.getElementById("user-badge"),
    userEmail: document.getElementById("user-email"),
    userRole: document.getElementById("user-role"),

    // Screens
    authScreen: document.getElementById("auth-screen"),
    uploadScreen: document.getElementById("upload-screen"),
    recommendScreen: document.getElementById("recommendation-screen"),
    adminScreen: document.getElementById("admin-screen"),

    // Auth Screen
    authModeTitle: document.getElementById("auth-mode-title"),
    authSubmitBtn: document.getElementById("auth-submit-btn"),
    authToggleLink: document.getElementById("auth-toggle-link"),
    authToggleText: document.getElementById("auth-toggle-text"),
    authRoleSelector: document.getElementById("auth-role-selector"),
    roleShopperBtn: document.getElementById("role-shopper"),
    roleOwnerBtn: document.getElementById("role-owner"),
    authEmail: document.getElementById("auth-email"),
    authPassword: document.getElementById("auth-password"),
    authError: document.getElementById("auth-error"),
    btnDemoShopper: document.getElementById("btn-demo-shopper"),
    btnDemoOwner: document.getElementById("btn-demo-owner"),
    
    // Upload Screen
    uploadZone: document.getElementById("upload-zone"),
    fileInput: document.getElementById("file-input"),
    uploadInstructions: document.getElementById("upload-instructions"),
    uploadPreviewContainer: document.getElementById("upload-preview-container"),
    uploadPreviewImg: document.getElementById("upload-preview-img"),
    btnRemoveUpload: document.getElementById("btn-remove-upload"),
    poseLoadingIndicator: document.getElementById("pose-loading-indicator"),
    calibrationPanel: document.getElementById("calibration-panel"),
    
    // Sliders
    sliderShoulder: document.getElementById("slider-shoulder"),
    sliderWaist: document.getElementById("slider-waist"),
    sliderHip: document.getElementById("slider-hip"),
    valShoulder: document.getElementById("val-shoulder"),
    valWaist: document.getElementById("val-waist"),
    valHip: document.getElementById("val-hip"),
    detectedShapeText: document.getElementById("detected-shape-text"),
    shapeExplanationText: document.getElementById("shape-explanation-text"),
    
    // Occasion Selection
    occasionCards: document.querySelectorAll(".occasion-card"),
    btnGetOutfit: document.getElementById("btn-get-outfit"),

    // Recommendation Screen
    viewportCanvas: document.getElementById("viewport-canvas"),
    sizeBadgeText: document.getElementById("size-badge-text"),
    outfitContainer: document.getElementById("outfit-container"),
    aiAdviceText: document.getElementById("ai-advice-text"),
    btnDownloadSummary: document.getElementById("btn-download-summary"),
    btnBackToUpload: document.getElementById("btn-back-to-upload"),

    // Drawers & Modals
    drawerBackdrop: document.getElementById("drawer-backdrop"),
    swapDrawer: document.getElementById("swap-drawer"),
    swapDrawerTitle: document.getElementById("swap-drawer-title"),
    swapDrawerClose: document.getElementById("swap-drawer-close"),
    swapItemsList: document.getElementById("swap-items-list"),

    // PDF Preview Modal
    pdfModal: document.getElementById("pdf-modal"),
    pdfModalClose: document.getElementById("pdf-modal-close"),
    pdfPreviewContent: document.getElementById("pdf-preview-content"),
    btnConfirmPdfDownload: document.getElementById("btn-confirm-pdf-download"),
    btnCancelPdf: document.getElementById("btn-cancel-pdf"),

    // Settings Modal
    settingsModal: document.getElementById("settings-modal"),
    settingsModalClose: document.getElementById("settings-modal-close"),
    geminiKeyInput: document.getElementById("gemini-key"),
    fashnKeyInput: document.getElementById("fashn-key"),
    firebaseConfigInput: document.getElementById("firebase-config-json"),
    btnSaveSettings: document.getElementById("btn-save-settings"),
    firebaseStatusIndicator: document.getElementById("firebase-status-indicator"),

    // Admin Panel Screen
    adminInventoryCount: document.getElementById("admin-inventory-count"),
    adminDbStatus: document.getElementById("admin-db-status"),
    btnAddGarment: document.getElementById("btn-add-garment"),
    adminGarmentTableBody: document.getElementById("admin-garment-table-body"),
    adminSearchInput: document.getElementById("admin-search-input"),
    
    // Admin Add/Edit Drawer
    adminDrawer: document.getElementById("admin-drawer"),
    adminDrawerTitle: document.getElementById("admin-drawer-title"),
    adminDrawerClose: document.getElementById("admin-drawer-close"),
    adminForm: document.getElementById("admin-form"),
    adminProdName: document.getElementById("prod-name"),
    adminProdCategory: document.getElementById("prod-category"),
    adminProdPrice: document.getElementById("prod-price"),
    adminProdSizes: document.getElementById("prod-sizes"),
    adminProdOccasions: document.getElementById("prod-occasions"),
    adminProdShapes: document.getElementById("prod-shapes"),
    adminProdImageUrl: document.getElementById("prod-image-url"),
    adminProdImageFile: document.getElementById("prod-image-file"),
    adminFormSubmitBtn: document.getElementById("admin-form-submit-btn")
  };

  let isRegisterMode = false;
  let selectedAuthRole = "shopper";

  // --- INITIALIZE SERVICES ---
  AuthService.initFirebase();
  DatabaseService.initFirestore();
  
  // Try loading MediaPipe ahead
  setTimeout(() => PoseService.init(), 1000);

  // Load saved API keys in Settings inputs
  DOM.geminiKeyInput.value = FitStyleConfig.KeyStore.getGeminiKey();
  DOM.fashnKeyInput.value = FitStyleConfig.KeyStore.getFashnKey();
  DOM.firebaseConfigInput.value = JSON.stringify(FitStyleConfig.getFirebaseConfig(), null, 2);
  updateFirebaseStatusIndicator();

  // --- NOTIFICATION UTILITY ---
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type} active`;
    
    let icon = "check-circle";
    if (type === "error") icon = "alert-circle";
    if (type === "warning") icon = "help-circle";

    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    safeCreateIcons();

    setTimeout(() => {
      toast.classList.remove("active");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  function updateFirebaseStatusIndicator() {
    const isFB = AuthService.isFirebase();
    DOM.firebaseStatusIndicator.className = `settings-status-indicator ${isFB ? 'ready' : ''}`;
    DOM.firebaseStatusIndicator.innerHTML = isFB 
      ? '<i data-lucide="shield-check" style="width:14px;height:14px;"></i> Live Firebase'
      : '<i data-lucide="cloud-off" style="width:14px;height:14px;"></i> Simulation Mode';
    safeCreateIcons();
  }

  // --- NAVIGATION ROUTING ---
  function navigateTo(screenName) {
    state.currentScreen = screenName;
    
    // Deactivate all screens safely
    [DOM.authScreen, DOM.uploadScreen, DOM.recommendScreen, DOM.adminScreen].forEach(s => {
      if (s) s.classList.remove("active");
    });
    
    if (DOM.btnGoAdmin) DOM.btnGoAdmin.style.display = "none";
    if (DOM.btnGoShopper) DOM.btnGoShopper.style.display = "none";

    if (screenName === "auth") {
      if (DOM.authScreen) DOM.authScreen.classList.add("active");
      if (DOM.header) DOM.header.style.display = "none";
    } else {
      if (DOM.header) DOM.header.style.display = "flex";
      
      // Update Header control buttons based on role
      if (state.currentUser) {
        if (DOM.userBadge) DOM.userBadge.className = `user-badge ${state.currentUser.role}`;
        if (DOM.userEmail) DOM.userEmail.textContent = state.currentUser.email;
        if (DOM.userRole) DOM.userRole.textContent = state.currentUser.role === "owner" ? "Store Owner" : "Shopper";
        
        if (state.currentUser.role === "owner") {
          if (screenName === "admin") {
            if (DOM.btnGoShopper) DOM.btnGoShopper.style.display = "flex";
          } else {
            if (DOM.btnGoAdmin) DOM.btnGoAdmin.style.display = "flex";
          }
        }
      }

      if (screenName === "upload") {
        if (DOM.uploadScreen) DOM.uploadScreen.classList.add("active");
      } else if (screenName === "recommend") {
        if (DOM.recommendScreen) DOM.recommendScreen.classList.add("active");
      } else if (screenName === "admin") {
        // Double check permission
        if (state.currentUser && state.currentUser.role !== "owner") {
          showToast("Access Denied: Admin panel is restricted to Store Owners.", "error");
          navigateTo("upload");
          return;
        }
        if (DOM.adminScreen) DOM.adminScreen.classList.add("active");
      }
    }
    safeCreateIcons();
  }

  // --- AUTHENTICATION FLOWS ---
  // Role selector buttons
  DOM.roleShopperBtn.addEventListener("click", () => {
    selectedAuthRole = "shopper";
    DOM.roleShopperBtn.classList.add("active");
    DOM.roleOwnerBtn.classList.remove("active");
  });

  DOM.roleOwnerBtn.addEventListener("click", () => {
    selectedAuthRole = "owner";
    DOM.roleOwnerBtn.classList.add("active");
    DOM.roleShopperBtn.classList.remove("active");
  });

  // Toggle Login/Register
  DOM.authToggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    DOM.authError.style.display = "none";
    
    if (isRegisterMode) {
      DOM.authModeTitle.textContent = "Create Account";
      DOM.authSubmitBtn.textContent = "Register & Onboard";
      DOM.authToggleText.textContent = "Already have an account? ";
      DOM.authToggleLink.textContent = "Sign In";
      DOM.authRoleSelector.style.display = "flex";
    } else {
      DOM.authModeTitle.textContent = "Welcome back";
      DOM.authSubmitBtn.textContent = "Sign In to Studio";
      DOM.authToggleText.textContent = "Don't have an account? ";
      DOM.authToggleLink.textContent = "Register";
      DOM.authRoleSelector.style.display = "none";
    }
  });

  // Handle Submit Form
  DOM.authSubmitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = DOM.authEmail.value.trim();
    const password = DOM.authPassword.value.trim();
    DOM.authError.style.display = "none";

    if (!email || !password) {
      DOM.authError.textContent = "Please fill in all email and password fields.";
      DOM.authError.style.display = "block";
      return;
    }

    try {
      DOM.authSubmitBtn.disabled = true;
      DOM.authSubmitBtn.textContent = isRegisterMode ? "Registering..." : "Signing In...";
      
      if (isRegisterMode) {
        await AuthService.register(email, password, selectedAuthRole);
        showToast("Account successfully registered!", "success");
      } else {
        await AuthService.login(email, password);
        showToast("Successfully signed in!", "success");
      }
    } catch (err) {
      DOM.authError.textContent = err.message || "Authentication service error";
      DOM.authError.style.display = "block";
    } finally {
      DOM.authSubmitBtn.disabled = false;
      DOM.authSubmitBtn.textContent = isRegisterMode ? "Register & Onboard" : "Sign In to Studio";
    }
  });

  // Sign out Button
  DOM.btnSignout.addEventListener("click", async () => {
    await AuthService.logout();
    state.uploadedImage = null;
    state.uploadedImageFile = null;
    state.analysisResult = null;
    state.selectedOccasion = null;
    if (DOM.uploadPreviewContainer) DOM.uploadPreviewContainer.style.display = "none";
    if (DOM.uploadInstructions) DOM.uploadInstructions.style.display = "block";
    if (DOM.btnGetOutfit) DOM.btnGetOutfit.disabled = true;
    showToast("Signed out successfully.");
  });

  // Demo shortcut buttons
  if (DOM.btnDemoShopper) {
    DOM.btnDemoShopper.addEventListener("click", async () => {
      DOM.btnDemoShopper.disabled = true;
      DOM.btnDemoShopper.textContent = "Loading...";
      try {
        await AuthService.login("shopper@fitstyle.com", "password123");
        showToast("Demo Shopper session started!", "success");
      } catch (e) {
        // If not seeded yet, register first
        try {
          await AuthService.register("shopper@fitstyle.com", "password123", "shopper");
          showToast("Demo Shopper account created!", "success");
        } catch (err) {
          showToast(err.message || "Demo login failed", "error");
        }
      } finally {
        DOM.btnDemoShopper.disabled = false;
        DOM.btnDemoShopper.innerHTML = '<i data-lucide="shopping-bag" style="width:15px;height:15px;"></i> Demo as Shopper';
        safeCreateIcons();
      }
    });
  }

  if (DOM.btnDemoOwner) {
    DOM.btnDemoOwner.addEventListener("click", async () => {
      DOM.btnDemoOwner.disabled = true;
      DOM.btnDemoOwner.textContent = "Loading...";
      try {
        await AuthService.login("owner@fitstyle.com", "password123");
        showToast("Demo Store Owner session started!", "success");
      } catch (e) {
        try {
          await AuthService.register("owner@fitstyle.com", "password123", "owner");
          showToast("Demo Owner account created!", "success");
        } catch (err) {
          showToast(err.message || "Demo login failed", "error");
        }
      } finally {
        DOM.btnDemoOwner.disabled = false;
        DOM.btnDemoOwner.innerHTML = '<i data-lucide="store" style="width:15px;height:15px;"></i> Demo as Store Owner';
        safeCreateIcons();
      }
    });
  }

  // Listen to Auth State
  AuthService.onAuthStateChanged((user) => {
    state.currentUser = user;
    updateFirebaseStatusIndicator();
    // Update admin DB status indicator
    if (DOM.adminDbStatus) {
      DOM.adminDbStatus.textContent = DatabaseService.isFirestore() ? "Firestore Live" : "Local Mode";
      DOM.adminDbStatus.style.color = DatabaseService.isFirestore() ? "var(--accent-gold)" : "var(--text-muted)";
    }

    if (user) {
      if (user.role === "owner" && state.currentScreen === "auth") {
        navigateTo("admin");
      } else if (state.currentScreen === "auth") {
        navigateTo("upload");
      }
    } else {
      navigateTo("auth");
    }
  });

  // --- PHOTO UPLOAD FLOW ---
  // Click upload zone trigger file input
  DOM.uploadZone.addEventListener("click", (e) => {
    if (e.target !== DOM.btnRemoveUpload && !DOM.btnRemoveUpload.contains(e.target)) {
      DOM.fileInput.click();
    }
  });

  // Handle Drag Over effects
  DOM.uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    DOM.uploadZone.classList.add("dragover");
  });

  DOM.uploadZone.addEventListener("dragleave", () => {
    DOM.uploadZone.classList.remove("dragover");
  });

  DOM.uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    DOM.uploadZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  DOM.fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  });

  function handleImageFile(file) {
    const validFormats = ["image/jpeg", "image/png", "image/webp"];
    if (!validFormats.includes(file.type)) {
      showToast("Unsupported format: Please upload a JPG, PNG, or WEBP image", "error");
      return;
    }

    state.uploadedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      state.uploadedImage = e.target.result;
      DOM.uploadPreviewImg.src = state.uploadedImage;
      DOM.uploadInstructions.style.display = "none";
      DOM.uploadPreviewContainer.style.display = "block";
      
      // Start pose detection automatically
      runPoseDetection();
    };
    reader.readAsDataURL(file);
  }

  DOM.btnRemoveUpload.addEventListener("click", (e) => {
    e.stopPropagation();
    state.uploadedImage = null;
    state.uploadedImageFile = null;
    state.analysisResult = null;
    DOM.uploadPreviewContainer.style.display = "none";
    DOM.uploadInstructions.style.display = "block";
    DOM.calibrationPanel.style.display = "none";
    DOM.btnGetOutfit.disabled = true;
  });

  // Run MediaPipe Vision task on uploaded photo
  async function runPoseDetection() {
    DOM.poseLoadingIndicator.style.display = "flex";
    DOM.calibrationPanel.style.display = "none";
    
    try {
      // Create temporary image element to pass to detector
      const img = new Image();
      img.src = state.uploadedImage;
      await new Promise(resolve => img.onload = resolve);
      
      const analysis = await PoseService.analyzeImage(img);
      state.analysisResult = analysis;
      
      // Update Sliders based on detected values
      DOM.sliderShoulder.value = analysis.measurements.shoulderWidth;
      DOM.sliderWaist.value = analysis.measurements.waistWidth;
      DOM.sliderHip.value = analysis.measurements.hipWidth;
      
      updateSliderValues();
      recalculateBodyShape();
      
      if (analysis.lowConfidence) {
        showToast("Low confidence landmark detection — please adjust sliders manually for better sizing accuracy.", "warning");
      } else {
        showToast("Body dimensions successfully analyzed.");
      }
    } catch (e) {
      console.warn("Pose detection failed:", e);
      showToast(e.message || "MediaPipe failed -> switching to manual adjustment sliders.", "warning");
      
      // Fallback: Initialize manual sliders at average proportions
      state.analysisResult = {
        measurements: { shoulderWidth: 88, waistWidth: 78, hipWidth: 92, height: 170 },
        shape: { shape: "Rectangle", explanation: "Calculations fallback. Adjust manual sliders for sizing recommendations." },
        landmarks: null
      };

      DOM.sliderShoulder.value = 88;
      DOM.sliderWaist.value = 78;
      DOM.sliderHip.value = 92;

      updateSliderValues();
      recalculateBodyShape();
    } finally {
      DOM.poseLoadingIndicator.style.display = "none";
      DOM.calibrationPanel.style.display = "flex";
      checkOutfitButtonState();
    }
  }

  // --- CALIBRATION SLIDERS FLOW ---
  function updateSliderValues() {
    DOM.valShoulder.textContent = `${DOM.sliderShoulder.value} cm`;
    DOM.valWaist.textContent = `${DOM.sliderWaist.value} cm`;
    DOM.valHip.textContent = `${DOM.sliderHip.value} cm`;
  }

  function recalculateBodyShape() {
    if (!state.analysisResult) return;

    // Convert values back to widths
    const s = parseFloat(DOM.sliderShoulder.value) / 2.2;
    const w = parseFloat(DOM.sliderWaist.value) / 2.2;
    const h = parseFloat(DOM.sliderHip.value) / 2.2;

    const classified = PoseService.classifyProportions(s, w, h);
    
    state.analysisResult.measurements = {
      shoulderWidth: parseInt(DOM.sliderShoulder.value),
      waistWidth: parseInt(DOM.sliderWaist.value),
      hipWidth: parseInt(DOM.sliderHip.value),
      height: state.analysisResult.measurements.height || 170
    };
    state.analysisResult.shape = classified;

    // Update UI text
    DOM.detectedShapeText.textContent = classified.shape;
    DOM.shapeExplanationText.textContent = classified.explanation;
  }

  // Bind slider events
  const sliders = [DOM.sliderShoulder, DOM.sliderWaist, DOM.sliderHip];
  sliders.forEach(slider => {
    slider.addEventListener("input", () => {
      updateSliderValues();
      recalculateBodyShape();
    });
  });

  // --- OCCASIONS CARD EVENT ---
  DOM.occasionCards.forEach(card => {
    card.addEventListener("click", () => {
      DOM.occasionCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      state.selectedOccasion = card.dataset.occasion;
      checkOutfitButtonState();
    });
  });

  function checkOutfitButtonState() {
    if (state.uploadedImage && state.selectedOccasion && state.analysisResult) {
      DOM.btnGetOutfit.disabled = false;
    } else {
      DOM.btnGetOutfit.disabled = true;
    }
  }

  // --- OUTFIT RECOMMENDATION GENERATION ---
  DOM.btnGetOutfit.addEventListener("click", async () => {
    if (DOM.btnGetOutfit.disabled) return;
    navigateTo("recommend");
    generateOutfitRecommendations();
  });

  async function generateOutfitRecommendations() {
    DOM.outfitContainer.innerHTML = `
      <div class="loader-container" style="grid-column: 1/-1;">
        <div class="loading-spinner"></div>
        <p>Styling your perfect outfit...</p>
      </div>
    `;
    DOM.aiAdviceText.innerHTML = "Consulting your AI Personal Stylist for styling rationale...";
    
    // Ensure viewport canvas dimensions match preview container aspect ratio
    const containerWidth = DOM.viewportCanvas.parentElement.clientWidth;
    DOM.viewportCanvas.width = containerWidth;
    DOM.viewportCanvas.height = containerWidth * (4/3);

    // Draw initial uploaded image on canvas
    const userImg = new Image();
    userImg.src = state.uploadedImage;
    userImg.onload = () => {
      const ctx = DOM.viewportCanvas.getContext("2d");
      ctx.drawImage(userImg, 0, 0, DOM.viewportCanvas.width, DOM.viewportCanvas.height);
      
      // Draw skeleton on top if in calibration mode or details exist
      if (state.analysisResult && state.analysisResult.landmarks) {
        PoseService.drawSkeleton(DOM.viewportCanvas, userImg, state.analysisResult);
      }
    };

    const products = DatabaseService.getProducts();
    const shape = state.analysisResult.shape.shape;
    const occasion = state.selectedOccasion;

    // Filter rules
    // 1. Matches selected occasion
    // 2. Fits body shape (suitability mapping)
    const filterGarments = (category) => {
      let filtered = products.filter(p => p.category === category && p.occasions.includes(occasion));
      
      // Filter by shape matches
      let shapeFiltered = filtered.filter(p => p.shapes.includes(shape));
      
      // If we have shape matches, use them. Otherwise, fall back to general occasion matching items.
      if (shapeFiltered.length > 0) {
        filtered = shapeFiltered;
      }
      
      // If still empty, fall back to any items in that category to avoid empty UI
      if (filtered.length === 0) {
        filtered = products.filter(p => p.category === category);
      }
      return filtered;
    };

    // Pick recommended outfit pieces
    const tops = filterGarments("Top");
    const bottoms = filterGarments("Bottom");
    const footwear = filterGarments("Footwear");
    const accessories = filterGarments("Accessory");

    state.currentOutfit.Top = tops[0] || null;
    state.currentOutfit.Bottom = bottoms[0] || null;
    state.currentOutfit.Footwear = footwear[0] || null;
    state.currentOutfit.Accessory = accessories[0] || null;

    // Update Outfit Grid and Try-On view
    await updateOutfitDisplay();
  }

  // Redraws try-on overlays and garment cards in grid
  async function updateOutfitDisplay() {
    DOM.outfitContainer.innerHTML = "";
    
    // Draw 2D canvas overlay
    const userImg = new Image();
    userImg.src = state.uploadedImage;
    userImg.onload = async () => {
      // Draw transparent clothes overlays
      await AIService.renderCanvasOverlay(DOM.viewportCanvas, userImg, state.analysisResult, state.currentOutfit);
    };

    // Render Size Recommendation Badge below image viewport
    const sizeRecommend = PoseService.recommendSize(state.analysisResult.measurements, "General");
    DOM.sizeBadgeText.innerHTML = `Estimated Fit Size: <strong>${sizeRecommend.letter}</strong> (Numeric EU ${sizeRecommend.numeric})`;

    // Generate outfit component tiles
    const categories = ["Top", "Bottom", "Footwear", "Accessory"];
    categories.forEach(cat => {
      const item = state.currentOutfit[cat];
      const sizeInfo = PoseService.recommendSize(state.analysisResult.measurements, cat);
      
      const card = document.createElement("div");
      card.className = "garment-card";
      
      if (!item) {
        card.innerHTML = `
          <div class="garment-img-wrapper" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
            <i data-lucide="tag" style="width:32px;height:32px;"></i>
          </div>
          <div class="garment-info">
            <div>
              <div class="garment-category-label">${cat}</div>
              <div class="garment-title">Unavailable</div>
            </div>
            <div class="garment-price-row">
              <span class="garment-price">$0.00</span>
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="garment-img-wrapper">
            <img class="garment-img" src="${item.imageUrl}" alt="${item.name}" crossorigin="anonymous">
            <span class="badge gold" style="position:absolute;top:10px;left:10px;backdrop-filter:blur(4px);background-color:rgba(10,11,13,0.7);">${sizeInfo.letter}</span>
          </div>
          <div class="garment-info">
            <div class="garment-meta">
              <div class="garment-category-label">${cat}</div>
              <div class="garment-title" title="${item.name}">${item.name}</div>
            </div>
            <div class="garment-price-row">
              <span class="garment-price">$${item.price.toFixed(2)}</span>
              <button class="btn-secondary btn-swap" data-category="${cat}">
                <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Swap
              </button>
            </div>
          </div>
        `;
      }
      DOM.outfitContainer.appendChild(card);
    });

    safeCreateIcons();

    // Bind Swapping buttons
    document.querySelectorAll(".btn-swap").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.category;
        openSwapDrawer(cat);
      });
    });

    // Request styling rationale from Gemini API (or simulated fallback)
    try {
      const advice = await AIService.generateStylingAdvice(
        state.analysisResult.shape.shape,
        state.selectedOccasion,
        state.currentOutfit
      );
      DOM.aiAdviceText.textContent = advice;
    } catch (e) {
      DOM.aiAdviceText.textContent = "Your selected outfit coordinates elegantly for the occasion. Focus on balancing upper and lower profiles.";
    }
  }

  // --- SWAPPING ITEMS MODAL DRAWER ---
  function openSwapDrawer(category) {
    state.activeSwapCategory = category;
    DOM.swapDrawerTitle.textContent = `Swap ${category} Alternatives`;
    
    // Get all products in category
    const products = DatabaseService.getProducts();
    const alternatives = products.filter(p => p.category === category);
    
    DOM.swapItemsList.innerHTML = "";
    
    if (alternatives.length === 0) {
      DOM.swapItemsList.innerHTML = `<div class="text-center" style="color:var(--text-muted);padding:2rem;">No alternative items found in catalogue.</div>`;
    } else {
      alternatives.forEach(item => {
        const currentSelected = state.currentOutfit[category] && state.currentOutfit[category].id === item.id;
        
        const row = document.createElement("div");
        row.className = "swap-item-row";
        row.dataset.id = item.id;
        
        row.innerHTML = `
          <img class="swap-item-img" src="${item.imageUrl}" alt="${item.name}" crossorigin="anonymous">
          <div class="swap-item-info">
            <div class="swap-item-name">${item.name}</div>
            <div class="swap-item-price">$${item.price.toFixed(2)}</div>
          </div>
          ${currentSelected ? '<span class="swap-item-selected-tag"><i data-lucide="check" style="width:16px;height:16px;"></i> Active</span>' : ''}
        `;
        
        row.addEventListener("click", () => {
          selectSwapGarment(item);
        });

        DOM.swapItemsList.appendChild(row);
      });
    }
    
    DOM.drawerBackdrop.classList.add("active");
    DOM.swapDrawer.classList.add("active");
    safeCreateIcons();
  }

  function closeSwapDrawer() {
    DOM.drawerBackdrop.classList.remove("active");
    DOM.swapDrawer.classList.remove("active");
    state.activeSwapCategory = null;
  }

  function selectSwapGarment(product) {
    state.currentOutfit[state.activeSwapCategory] = product;
    closeSwapDrawer();
    updateOutfitDisplay();
    showToast(`Swapped in ${product.name}.`);
  }

  DOM.swapDrawerClose.addEventListener("click", closeSwapDrawer);
  DOM.drawerBackdrop.addEventListener("click", closeSwapDrawer);

  // Back button in recommendation
  DOM.btnBackToUpload.addEventListener("click", () => {
    navigateTo("upload");
  });

  // --- PDF SUMMARY PREVIEW AND DOWNLOAD ---
  DOM.btnDownloadSummary.addEventListener("click", () => {
    openPdfPreviewModal();
  });

  function openPdfPreviewModal() {
    const sizeRecommend = PoseService.recommendSize(state.analysisResult.measurements, "General");
    const items = Object.entries(state.currentOutfit).filter(([_, item]) => item !== null);
    
    let totalPrice = 0;
    let itemsRowsHtml = "";
    
    items.forEach(([cat, item]) => {
      const sizeInfo = PoseService.recommendSize(state.analysisResult.measurements, cat);
      itemsRowsHtml += `
        <tr>
          <td><span class="badge rose">${cat}</span></td>
          <td><strong>${item.name}</strong></td>
          <td>Size: ${sizeInfo.letter}</td>
          <td>$${item.price.toFixed(2)}</td>
        </tr>
      `;
      totalPrice += item.price;
    });

    const config = FitStyleConfig;
    
    DOM.pdfPreviewContent.innerHTML = `
      <div class="pdf-preview-box">
        <div class="pdf-preview-header">
          <div class="pdf-preview-logo">FITSTYLE AI</div>
          <div class="pdf-preview-date">${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="pdf-preview-meta-grid">
          <div class="pdf-preview-meta-col">
            <h4>Silhouette Profile</h4>
            <p>Body Shape: ${state.analysisResult.shape.shape}</p>
          </div>
          <div class="pdf-preview-meta-col">
            <h4>Occasion</h4>
            <p>${state.selectedOccasion}</p>
          </div>
        </div>
        
        <div class="pdf-preview-layout">
          <img class="pdf-preview-avatar" src="${DOM.viewportCanvas.toDataURL("image/jpeg", 0.75)}" alt="styling thumbnail">
          <div>
            <table class="pdf-preview-table">
              <thead>
                <tr>
                  <th>Cat</th>
                  <th>Garment Item</th>
                  <th>Fit Size</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>
            <div class="pdf-preview-total">Total Outfit Price: $${totalPrice.toFixed(2)}</div>
          </div>
        </div>
        
        <div style="font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 10px; margin-bottom: 15px;">
          <strong style="color:var(--accent-gold); display:block; margin-bottom: 5px;">STYLIST NOTES:</strong>
          <p style="color:#555; line-height: 1.4;">${DOM.aiAdviceText.textContent}</p>
        </div>

        <div class="pdf-preview-footer">
          <strong>${config.storeName}</strong> • ${config.storeAddress}<br>
          Store Hours: ${config.storeHours} • Call: ${config.storeContact}
        </div>
      </div>
    `;

    DOM.pdfModal.classList.add("active");
  }

  function closePdfModal() {
    DOM.pdfModal.classList.remove("active");
  }

  DOM.pdfModalClose.addEventListener("click", closePdfModal);
  DOM.btnCancelPdf.addEventListener("click", closePdfModal);

  DOM.btnConfirmPdfDownload.addEventListener("click", async () => {
    try {
      DOM.btnConfirmPdfDownload.disabled = true;
      DOM.btnConfirmPdfDownload.textContent = "Compiling PDF...";
      
      const canvasSnapshot = DOM.viewportCanvas;
      const analysis = state.analysisResult;
      const sizeRecommend = PoseService.recommendSize(state.analysisResult.measurements, "General");
      const occasion = state.selectedOccasion;
      const outfitItems = state.currentOutfit;
      const adviceText = DOM.aiAdviceText.textContent;
      
      await PDFService.generateAndDownloadPDF(canvasSnapshot, analysis, sizeRecommend, occasion, outfitItems, adviceText);
      
      showToast("Styling PDF successfully downloaded!");
      closePdfModal();
    } catch (e) {
      console.error(e);
      showToast("PDF generation failed. Please try again.", "error");
    } finally {
      DOM.btnConfirmPdfDownload.disabled = false;
      DOM.btnConfirmPdfDownload.textContent = "Download PDF";
    }
  });

  // --- FLOATING SETTINGS DIALOG ---
  DOM.btnGoSettings.addEventListener("click", () => {
    // Populate settings values
    DOM.geminiKeyInput.value = FitStyleConfig.KeyStore.getGeminiKey();
    DOM.fashnKeyInput.value = FitStyleConfig.KeyStore.getFashnKey();
    DOM.firebaseConfigInput.value = JSON.stringify(FitStyleConfig.getFirebaseConfig(), null, 2);
    DOM.settingsModal.classList.add("active");
  });

  DOM.settingsModalClose.addEventListener("click", () => {
    DOM.settingsModal.classList.remove("active");
  });

  DOM.btnSaveSettings.addEventListener("click", () => {
    const gemini = DOM.geminiKeyInput.value.trim();
    const fashn = DOM.fashnKeyInput.value.trim();
    const configStr = DOM.firebaseConfigInput.value.trim();

    try {
      const config = JSON.parse(configStr);
      FitStyleConfig.saveFirebaseConfig(config);
      FitStyleConfig.KeyStore.setGeminiKey(gemini);
      FitStyleConfig.KeyStore.setFashnKey(fashn);
      
      showToast("Settings and configurations successfully updated. Restarting services...", "success");
      DOM.settingsModal.classList.remove("active");

      // Re-init Firebase/Firestore structures
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      showToast("Failed to save: Invalid Firebase JSON Config format", "error");
    }
  });

  // Navigation commands in header
  DOM.btnGoAdmin.addEventListener("click", () => {
    navigateTo("admin");
  });

  DOM.btnGoShopper.addEventListener("click", () => {
    navigateTo("upload");
  });

  // --- STORE CATALOGUE OWNER ADMIN DASHBOARD ---
  // Subscribing to Firestore / local catalog updates
  DatabaseService.subscribeCatalogue((updatedCatalogue) => {
    state.catalogue = updatedCatalogue;
    
    // Update dashboard counter
    DOM.adminInventoryCount.textContent = updatedCatalogue.length;

    // If on admin page, refresh grid table
    if (state.currentScreen === "admin") {
      renderAdminGarmentsTable();
    }
  });

  function renderAdminGarmentsTable(filterQuery = "") {
    DOM.adminGarmentTableBody.innerHTML = "";
    
    const query = filterQuery.toLowerCase().trim();
    const filtered = state.catalogue.filter(p => {
      return p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      DOM.adminGarmentTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="color:var(--text-muted);padding:2rem;">
            No items listed in the store inventory matching the query.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((p, idx) => {
      const tr = document.createElement("tr");
      
      const occasionsBadges = p.occasions.map(occ => `<span class="badge gold" style="font-size:0.75rem;margin:2px;">${occ}</span>`).join("");
      const shapesBadges = p.shapes.map(sh => `<span class="badge rose" style="font-size:0.75rem;margin:2px;">${sh}</span>`).join("");
      
      tr.innerHTML = `
        <td><img class="admin-item-thumb" src="${p.imageUrl}" alt="${p.name}" crossorigin="anonymous"></td>
        <td>
          <div style="font-weight:600;">${p.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${p.id}</div>
        </td>
        <td><span class="badge">${p.category}</span></td>
        <td>
          <div style="font-size:0.85rem;"><strong>Sizes:</strong> ${p.sizes.join(", ")}</div>
          <div style="margin-top:0.35rem;">${occasionsBadges}</div>
        </td>
        <td>
          <div style="max-width:200px;overflow-x:auto;">${shapesBadges}</div>
        </td>
        <td>
          <div style="font-family:'Outfit',sans-serif;font-weight:700;color:var(--accent-gold);">$${p.price.toFixed(2)}</div>
        </td>
        <td>
          <div style="display:flex;gap:0.5rem;">
            <button class="admin-btn-action edit" data-id="${p.id}" title="Edit Item"><i data-lucide="edit-3" style="width:14px;height:14px;"></i></button>
            <button class="admin-btn-action delete" data-id="${p.id}" title="Delete Item"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
          </div>
        </td>
      `;
      DOM.adminGarmentTableBody.appendChild(tr);
    });

    safeCreateIcons();

    // Bind buttons actions
    document.querySelectorAll(".admin-btn-action.edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        openAdminFormDrawer(id);
      });
    });

    document.querySelectorAll(".admin-btn-action.delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        deleteAdminGarment(id);
      });
    });
  }

  // Handle live search bar
  DOM.adminSearchInput.addEventListener("input", (e) => {
    renderAdminGarmentsTable(e.target.value);
  });

  // Add Item Drawer binds
  DOM.btnAddGarment.addEventListener("click", () => {
    openAdminFormDrawer();
  });

  function openAdminFormDrawer(productId = null) {
    DOM.adminForm.reset();
    state.activeEditingProduct = null;

    if (productId) {
      state.activeEditingProduct = productId;
      DOM.adminDrawerTitle.textContent = "Edit Catalogue Garment";
      DOM.adminFormSubmitBtn.textContent = "Save Changes";
      
      const prod = state.catalogue.find(p => p.id === productId);
      if (prod) {
        DOM.adminProdName.value = prod.name;
        DOM.adminProdCategory.value = prod.category;
        DOM.adminProdPrice.value = prod.price;
        DOM.adminProdSizes.value = prod.sizes.join(", ");
        DOM.adminProdOccasions.value = prod.occasions.join(", ");
        DOM.adminProdShapes.value = prod.shapes.join(", ");
        DOM.adminProdImageUrl.value = prod.imageUrl;
      }
    } else {
      DOM.adminDrawerTitle.textContent = "Add Product Intake";
      DOM.adminFormSubmitBtn.textContent = "List to Shop";
    }

    DOM.drawerBackdrop.classList.add("active");
    DOM.adminDrawer.classList.add("active");
  }

  function closeAdminDrawer() {
    DOM.drawerBackdrop.classList.remove("active");
    DOM.adminDrawer.classList.remove("active");
    state.activeEditingProduct = null;
  }

  DOM.adminDrawerClose.addEventListener("click", closeAdminDrawer);

  // Form Submit Handler for Add/Edit
  DOM.adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = DOM.adminProdName.value.trim();
    const category = DOM.adminProdCategory.value;
    const price = parseFloat(DOM.adminProdPrice.value.trim());
    const sizesRaw = DOM.adminProdSizes.value.trim();
    const occasionsRaw = DOM.adminProdOccasions.value.trim();
    const shapesRaw = DOM.adminProdShapes.value.trim();
    const imageUrl = DOM.adminProdImageUrl.value.trim();

    // Inline Validations
    if (!name || !category || isNaN(price) || !sizesRaw || !occasionsRaw || !shapesRaw) {
      showToast("Validation Error: Please fill in all required inputs.", "error");
      return;
    }

    let finalImageUrl = imageUrl;
    
    // Handle image file upload input if provided (convert local image to base64)
    if (DOM.adminProdImageFile.files && DOM.adminProdImageFile.files[0]) {
      try {
        const file = DOM.adminProdImageFile.files[0];
        const base64 = await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = (ev) => resolve(ev.target.result);
          r.readAsDataURL(file);
        });
        finalImageUrl = base64;
      } catch (err) {
        showToast("Garment image upload failed — preserving inputs and retrying.", "error");
        return;
      }
    }

    if (!finalImageUrl) {
      // Fallback unsplash matching category
      if (category === "Top") finalImageUrl = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500";
      else if (category === "Bottom") finalImageUrl = "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500";
      else if (category === "Footwear") finalImageUrl = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500";
      else finalImageUrl = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500";
    }

    // Split parameters by comma and clean whitespaces
    const sizes = sizesRaw.split(",").map(s => s.trim()).filter(s => s !== "");
    const occasions = occasionsRaw.split(",").map(o => o.trim()).filter(o => o !== "");
    const shapes = shapesRaw.split(",").map(s => s.trim()).filter(s => s !== "");

    const fields = {
      name,
      category,
      price,
      sizes,
      occasions,
      shapes,
      imageUrl: finalImageUrl
    };

    try {
      if (state.activeEditingProduct) {
        await DatabaseService.updateProduct(state.activeEditingProduct, fields);
        showToast(`Successfully updated garment: ${name}`);
      } else {
        await DatabaseService.addProduct(fields);
        showToast(`Successfully added garment: ${name}`);
      }
      closeAdminDrawer();
    } catch (err) {
      showToast(err.message || "Failed to update item.", "error");
    }
  });

  async function deleteAdminGarment(id) {
    const prod = state.catalogue.find(p => p.id === id);
    if (!prod) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${prod.name}" from catalogue inventory?`);
    if (!confirmDelete) return;

    try {
      await DatabaseService.deleteProduct(id);
      showToast(`Deleted ${prod.name} from inventory.`);
    } catch (err) {
      showToast("Delete operation failed.", "error");
    }
  }

});
