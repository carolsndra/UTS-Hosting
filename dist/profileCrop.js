(function() {
  'use strict';
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCrop);
  } else {
    initCrop();
  }
  
  function initCrop() {
    const profileFotoInput = document.getElementById('profileFotoInput');
    if (!profileFotoInput) {
      console.log('profileFotoInput not found, skipping crop initialization');
      return;
    }
    
    let cropModal = document.getElementById('cropModal');
    if (!cropModal) {
      createCropModal();
      cropModal = document.getElementById('cropModal');
      if (!cropModal) {
        console.error('Failed to create crop modal');
        return;
      }
    }
    
    let originalImageFile = null;
    let cropImageElement = null;
    let cropScale = 1;
    let cropX = 0;
    let cropY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let startCropX = 0;
    let startCropY = 0;
    
    const cropImage = document.getElementById('cropImage');
    const cropContainer = document.getElementById('cropContainer');
    const cropClose = document.getElementById('cropClose');
    const cropCancel = document.getElementById('cropCancel');
    const cropSave = document.getElementById('cropSave');
    const profileAvatar = document.getElementById('profileAvatar');
    const profilePlaceholder = document.getElementById('profileAvatarPlaceholder');
 
    function createCropModal() {
      const modalHTML = `
        <div id="cropModal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-[60]" style="position: fixed !important; display: none;">
          <div class="bg-white rounded-xl p-6 w-[90vw] max-w-md shadow-2xl relative">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-pink-600">Pangkas Foto</h3>
              <button id="cropClose" class="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            
            <div class="relative mb-4" style="width: 100%; padding-bottom: 100%; background: #f3f4f6; border-radius: 50%; overflow: hidden; position: relative;">
              <div id="cropContainer" class="absolute inset-0 flex items-center justify-center" style="cursor: move; position: relative; user-select: none;">
                <img id="cropImage" src="" alt="Crop" style="display: block; user-select: none; pointer-events: auto; position: absolute; max-width: none; max-height: none; cursor: move;">
              </div>
              <div id="cropOverlay" class="absolute inset-0 pointer-events-none" style="border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5); z-index: 10;"></div>
            </div>

            <div class="flex gap-2">
              <button id="cropCancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Batalkan</button>
              <button id="cropSave" class="flex-1 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">Simpan</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    function openCropModal(file) {
      if (!file) {
        console.error('No file provided to openCropModal');
        return;
      }
      
      let currentModal = document.getElementById('cropModal');
      if (!currentModal) {
        console.log('Crop modal not found, creating it...');
        createCropModal();
        currentModal = document.getElementById('cropModal');
        if (!currentModal) {
          console.error('Failed to create crop modal');
          alert('Gagal memuat modal crop. Silakan refresh halaman.');
          return;
        }
        console.log('Crop modal created successfully');
      }
      
      originalImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          cropImageElement = img;
          
          const currentCropImage = document.getElementById('cropImage');
          const currentCropContainer = document.getElementById('cropContainer');
          const currentModal = document.getElementById('cropModal');
          
          if (!currentCropImage) {
            console.error('cropImage element not found');
            return;
          }
          if (!currentCropContainer) {
            console.error('cropContainer element not found');
            return;
          }
          if (!currentModal) {
            console.error('cropModal element not found');
            return;
          }
          
          currentModal.classList.remove('hidden');
          currentModal.classList.add('flex');
          currentModal.style.display = 'flex';
          
          setTimeout(() => {
            const currentCropImage = document.getElementById('cropImage');
            const currentCropContainer = document.getElementById('cropContainer');
            
            if (!currentCropImage || !currentCropContainer) {
              console.error('Elements not found in setTimeout');
              return;
            }
            
            const containerSize = currentCropContainer.offsetWidth || currentCropContainer.clientWidth || 300;
            const imgAspect = img.width / img.height;
            const containerAspect = 1; 

            if (imgAspect > containerAspect) {

              cropScale = (containerSize * 1.2) / img.height;
            } else {
              cropScale = (containerSize * 1.2) / img.width;
            }
            
            cropX = 0;
            cropY = 0;
            
            currentCropImage.src = e.target.result;
            currentCropImage.style.display = 'block';
            currentCropImage.style.visibility = 'visible';
            currentCropImage.style.opacity = '1';
            
            updateCropImage();
          }, 150);
        };
        img.onerror = (err) => {
          console.error('Error loading image:', err);
          alert('Gagal memuat gambar. Pastikan file adalah gambar yang valid.');
        };
        img.src = e.target.result;
      };
      reader.onerror = (err) => {
        console.error('Error reading file:', err);
        alert('Gagal membaca file. Pastikan file adalah gambar yang valid.');
      };
      reader.readAsDataURL(file);
    }
    
    function updateCropImage() {
      if (!cropImageElement) {
        console.error('cropImageElement not found');
        return;
      }
      
      const currentCropImage = document.getElementById('cropImage');
      const currentCropContainer = document.getElementById('cropContainer');
      
      if (!currentCropImage || !currentCropContainer) {
        console.error('Missing elements for updateCropImage');
        return;
      }
      
      const containerSize = currentCropContainer.offsetWidth || currentCropContainer.clientWidth || 300;
      const imgWidth = cropImageElement.width * cropScale;
      const imgHeight = cropImageElement.height * cropScale;
      
      const centerX = containerSize / 2;
      const centerY = containerSize / 2;
      
      currentCropImage.style.width = `${imgWidth}px`;
      currentCropImage.style.height = `${imgHeight}px`;
      currentCropImage.style.left = `${centerX + cropX}px`;
      currentCropImage.style.top = `${centerY + cropY}px`;
      currentCropImage.style.transform = 'translate(-50%, -50%)';
      currentCropImage.style.display = 'block';
      currentCropImage.style.visibility = 'visible';
      currentCropImage.style.opacity = '1';
      currentCropImage.style.position = 'absolute';
      currentCropImage.style.objectFit = 'cover';
      currentCropImage.style.zIndex = '1';
    }
    
    function closeCropModal() {
      const currentModal = document.getElementById('cropModal');
      if (currentModal) {
        currentModal.classList.add('hidden');
        currentModal.classList.remove('flex');
        currentModal.style.display = 'none';
      }
      cropImageElement = null;
      originalImageFile = null;
      croppedImageBlob = null;
    }
    
    if (cropContainer) {
      cropContainer.addEventListener('mousedown', (e) => {
        if (!cropImageElement) return;
        
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        startCropX = cropX;
        startCropY = cropY;
        cropContainer.style.cursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation();
      });
    }
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging && cropImageElement) {
        const currentCropContainer = document.getElementById('cropContainer');
        if (!currentCropContainer) return;
        
        const containerSize = currentCropContainer.offsetWidth || currentCropContainer.clientWidth || 300;
        const radius = containerSize / 2;
        const imgWidth = cropImageElement.width * cropScale;
        const imgHeight = cropImageElement.height * cropScale;
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        let newX = startCropX + deltaX;
        let newY = startCropY + deltaY;
        
        const maxX = radius + (imgWidth / 2) - radius;
        const minX = -(imgWidth / 2) + radius;
        const maxY = radius + (imgHeight / 2) - radius;
        const minY = -(imgHeight / 2) + radius;
        
        cropX = Math.max(minX, Math.min(maxX, newX));
        cropY = Math.max(minY, Math.min(maxY, newY));
        
        updateCropImage();
        e.preventDefault();
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        isDragging = false;
        const currentCropContainer = document.getElementById('cropContainer');
        if (currentCropContainer) {
          currentCropContainer.style.cursor = 'move';
        }
      }
    });
    
    if (cropImage) {
      cropImage.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
    }
    
    if (cropContainer) {
      cropContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (!cropImageElement) return;
        
        const sensitivity = 0.02; 
        const zoomFactor = 1 + (e.deltaY > 0 ? -sensitivity : sensitivity);
        const newScale = cropScale * zoomFactor;
        
        const currentCropContainer = document.getElementById('cropContainer');
        if (!currentCropContainer) return;
        
        const containerSize = currentCropContainer.offsetWidth || currentCropContainer.clientWidth || 300;
        const minScale = Math.min(containerSize / cropImageElement.width, containerSize / cropImageElement.height) * 0.8;
        const maxScale = minScale * 4; 

        if (newScale >= minScale && newScale <= maxScale) {
          cropScale = newScale;
          updateCropImage();
        }
      });
    }
    
    async function cropImageToCircle() {
      if (!cropImageElement) return null;
      
      const currentCropContainer = document.getElementById('cropContainer');
      if (!currentCropContainer) return null;
      
      const canvas = document.createElement('canvas');
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      
      const containerSize = currentCropContainer.offsetWidth || 300;
      const radius = containerSize / 2;
      const imgWidth = cropImageElement.width * cropScale;
      const imgHeight = cropImageElement.height * cropScale;
      const imgCenterX = radius + cropX;
      const imgCenterY = radius + cropY;
      const circleLeft = radius - radius;
      const circleTop = radius - radius;
      const circleRight = radius + radius;
      const circleBottom = radius + radius;
      const imgLeft = imgCenterX - imgWidth / 2;
      const imgTop = imgCenterY - imgHeight / 2;
      const sourceX = Math.max(0, (circleLeft - imgLeft) / cropScale);
      const sourceY = Math.max(0, (circleTop - imgTop) / cropScale);
      const sourceRight = Math.min(cropImageElement.width, (circleRight - imgLeft) / cropScale);
      const sourceBottom = Math.min(cropImageElement.height, (circleBottom - imgTop) / cropScale);
      const sourceWidth = sourceRight - sourceX;
      const sourceHeight = sourceBottom - sourceY;
      
      ctx.drawImage(
        cropImageElement,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, size, size
      );
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.95);
      });
    }
    
    if (cropSave) {
      cropSave.addEventListener('click', async () => {
        const blob = await cropImageToCircle();
        if (blob) {
          croppedImageBlob = blob;
          const file = new File([blob], originalImageFile.name, { type: 'image/png' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          profileFotoInput.files = dataTransfer.files;
          
          const reader = new FileReader();
          reader.onload = (e) => {
            if (profileAvatar) {
              profileAvatar.src = e.target.result;
              profileAvatar.classList.remove('hidden');
            }
            if (profilePlaceholder) {
              profilePlaceholder.classList.add('hidden');
            }
          };
          reader.readAsDataURL(blob);
          closeCropModal();
        }
      });
    }
    
    if (cropCancel) {
      cropCancel.addEventListener('click', () => {
        closeCropModal();
        profileFotoInput.value = '';
      });
    }
    
    if (cropClose) {
      cropClose.addEventListener('click', () => {
        closeCropModal();
        profileFotoInput.value = '';
      });
    }
    
    profileFotoInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        openCropModal(this.files[0]);
      } else {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.avatar && profileAvatar) {
          profileAvatar.src = u.avatar; 
          profileAvatar.classList.remove('hidden');
          if (profilePlaceholder) profilePlaceholder.classList.add('hidden');
        } else {
          if (profileAvatar) profileAvatar.classList.add('hidden');
          if (profilePlaceholder) profilePlaceholder.classList.remove('hidden');
        }
      }
    });
  } 
})(); 