document.addEventListener('DOMContentLoaded', function() {
    console.log('--- mission.js: DOMContentLoaded event fired. Starting initialization. ---');

    // 1. 立即獲取所有 DOM 元素
    const missionTitleDisplay = document.getElementById('missionTitleDisplay');
    const missionTitleInput = document.getElementById('missionTitleInput');
    const missionTypeSelect = document.getElementById('missionTypeSelect');
    const programFilePath = document.getElementById('programFilePath');
    const programFileInput = document.getElementById('programFileInput');
    const selectFileButton = document.getElementById('selectFileButton');
    const missionDescriptionTextarea = document.getElementById('missionDescriptionTextarea');
    const currentDateDisplay = document.getElementById('currentDateDisplay'); // 確保正確獲取元素
    const saveMissionButton = document.getElementById('saveMissionButton');
    const deleteMissionButton = document.getElementById('deleteMissionButton');

    // 檢查關鍵元素是否獲取成功
    if (!currentDateDisplay) {
        console.error('CRITICAL ERROR: currentDateDisplay element with ID "currentDateDisplay" not found in the DOM!');
        return; // 如果核心元素缺失，停止執行後續邏輯
    }
    console.log('currentDateDisplay element successfully found:', currentDateDisplay.outerHTML);

    if (!missionTitleDisplay) console.error('Warning: missionTitleDisplay element not found.');
    if (!missionTitleInput) console.error('Warning: missionTitleInput element not found.');
    // ... 可以為其他所有元素也添加類似的檢查，但 currentDateDisplay 是你當前的痛點

    let currentMissionId = null; // 用於判斷是新增還是編輯

    // -----------------------------------------------------------
    // 更新日期的邏輯 - 放在最前面確保優先執行
    // -----------------------------------------------------------
    function updateCurrentDate() {
        const now = new Date();
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        // current month, day, year (e.g., "01 JUN 2025")
        const formattedDate = now.toLocaleDateString('en-US', options).toUpperCase().replace(',', '');
        
        console.log('DEBUG: Formatted Date calculated:', formattedDate);
        currentDateDisplay.textContent = formattedDate; // 設定日期
        console.log('DEBUG: After setting textContent, currentDateDisplay.textContent is:', currentDateDisplay.textContent);
        console.log('DEBUG: Full currentDateDisplay element HTML after update:', currentDateDisplay.outerHTML);
    }

    // 在處理任務載入/編輯邏輯之前，優先設置當前日期
    // 這樣即使後面有舊日期覆蓋，也能在此處觀察到初始設定
    updateCurrentDate(); 
    console.log('DEBUG: Initial date update attempted.');

    // -----------------------------------------------------------
    // 地圖相關邏輯 (保持不變，但確保其在DOM準備好後才運行)
    // -----------------------------------------------------------
    let map;
    let currentMarker;
    const defaultCoords = [22.65179931568485, 120.3287467259979]; // 高雄市三民區
    const defaultPopupText = '<b>預設位置</b><br>高雄市三民區';

    function initializeMap(latitude, longitude, popupText) {
        if (!map) { // 僅在 map 尚未初始化時創建
            map = L.map('mapid').setView([latitude, longitude], 18);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        } else {
            map.setView([latitude, longitude], 18);
        }
        
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        currentMarker = L.marker([latitude, longitude]).addTo(map)
            .bindPopup(popupText)
            .openPopup();
        console.log(`Map initialized/updated at: ${latitude}, ${longitude}`);
    }

    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const popupText = '<b>您的當前位置</b><br>透過瀏覽器定位';
                    initializeMap(latitude, longitude, popupText);
                    console.log(`Current location obtained: ${latitude}, ${longitude}`);
                },
                (error) => {
                    console.error('Error getting geolocation:', error.message);
                    alert('無法獲取您的位置，將顯示預設地圖。請允許瀏覽器定位權限。');
                    initializeMap(defaultCoords[0], defaultCoords[1], defaultPopupText);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            alert('您的瀏覽器不支持地理位置功能，將顯示預設地圖。');
            initializeMap(defaultCoords[0], defaultCoords[1], defaultPopupText);
        }
    }
    
    // 確保 #mapid 存在後才初始化地圖
    const mapElement = document.getElementById('mapid');
    if (mapElement) {
        getCurrentLocation(); // 首次加載時嘗試獲取當前位置
    } else {
        console.error('ERROR: Map element with ID "mapid" not found in the DOM. Map cannot be initialized.');
    }


    // -----------------------------------------------------------
    // Program Import 的檔案選擇邏輯
    // -----------------------------------------------------------
    if (selectFileButton && programFileInput && programFilePath) {
        selectFileButton.addEventListener('click', () => {
            console.log('Event: Select File button clicked, triggering file input.');
            programFileInput.click();
        });
        programFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                programFilePath.value = file.name;
                console.log('Event: Selected file:', file.name);
            } else {
                programFilePath.value = 'No file selected';
                console.log('Event: No file selected.');
            }
        });
    } else {
        console.warn('Warning: File selection elements (selectFileButton, programFileInput, programFilePath) not all found. File import feature might not work.');
    }

    // -----------------------------------------------------------
    // 任務載入 (編輯模式) - 關鍵修正在此
    // -----------------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const missionIdFromUrl = urlParams.get('id');
    console.log('DEBUG: Mission ID from URL:', missionIdFromUrl);

    if (missionIdFromUrl) {
        const missions = JSON.parse(localStorage.getItem('missions')) || [];
        const missionToEdit = missions.find(m => m.id === missionIdFromUrl);

        if (missionToEdit) {
            currentMissionId = missionToEdit.id;
            missionTitleDisplay.textContent = missionToEdit.title;
            missionTitleInput.value = missionToEdit.title;
            missionTypeSelect.value = missionToEdit.type;
            programFilePath.value = missionToEdit.program || 'No file selected';
            missionDescriptionTextarea.value = missionToEdit.description;
            // !!! 關鍵修正：移除這行，確保日期不會被舊任務的日期覆蓋 !!!
            // currentDateDisplay.textContent = missionToEdit.date; 
            deleteMissionButton.style.display = 'inline-block'; // 編輯模式下顯示刪除按鈕
            console.log('DEBUG: Loaded mission data for editing:', missionToEdit);
        } else {
            console.warn('Warning: Mission with ID not found in localStorage. Redirecting to index:', missionIdFromUrl);
            alert('Mission not found!');
            window.location.href = '../index.html';
        }
    } else {
        // 新增模式，隱藏刪除按鈕
        deleteMissionButton.style.display = 'none';
        console.log('DEBUG: New mission creation mode.');
    }

    // -----------------------------------------------------------
    // SAVE 按鈕事件處理
    // -----------------------------------------------------------
    if (saveMissionButton) {
        saveMissionButton.addEventListener('click', () => {
            console.log('Event: Save button clicked!');

            const missionTitle = missionTitleInput.value.trim();
            const missionType = missionTypeSelect.value;
            const missionProgram = programFilePath.value;
            const missionDescription = missionDescriptionTextarea.value.trim();
            // 從顯示元素獲取當前日期，它應該是今天的日期
            const missionDate = currentDateDisplay.textContent; 

            console.log('DEBUG: Gathered mission data for saving:', {
                title: missionTitle,
                type: missionType,
                program: missionProgram,
                description: missionDescription,
                date: missionDate 
            });

            if (!missionTitle) {
                alert('Mission Title cannot be empty!');
                console.warn('Save failed: Mission Title is empty.');
                return;
            }

            let missions = JSON.parse(localStorage.getItem('missions')) || [];
            console.log('DEBUG: Current missions from localStorage (before save):', missions);

            if (currentMissionId) {
                // 編輯現有任務
                const missionIndex = missions.findIndex(m => m.id === currentMissionId);
                if (missionIndex > -1) {
                    missions[missionIndex] = {
                        id: currentMissionId,
                        title: missionTitle,
                        type: missionType,
                        program: missionProgram,
                        description: missionDescription,
                        date: missionDate // 儲存今天的日期
                    };
                    console.log('DEBUG: Mission updated in array:', missions[missionIndex]);
                } else {
                    console.error('ERROR: Could not find mission to update with ID:', currentMissionId);
                    alert('Error: Could not find mission to update.');
                    return; 
                }
            } else {
                // 新增任務
                const newMission = {
                    id: 'mission_' + Date.now(), // 簡單生成唯一 ID
                    title: missionTitle,
                    type: missionType,
                    program: missionProgram,
                    description: missionDescription,
                    date: missionDate // 儲存今天的日期
                };
                missions.push(newMission);
                console.log('DEBUG: New mission added to array:', newMission);
            }

            try {
                localStorage.setItem('missions', JSON.stringify(missions));
                console.log('DEBUG: Missions successfully saved to localStorage:', missions);
                alert('Mission saved successfully!');
                window.location.href = '../index.html'; // 儲存後回到主頁
            } catch (e) {
                console.error('ERROR: Error saving to localStorage:', e);
                alert('Error saving mission: ' + e.message);
            }
        });
    } else {
        console.error('ERROR: Save button element with ID "saveMissionButton" not found.');
    }

    // -----------------------------------------------------------
    // DELETE 按鈕事件處理
    // -----------------------------------------------------------
    if (deleteMissionButton) {
        deleteMissionButton.addEventListener('click', () => {
            console.log('Event: Delete button clicked! Current Mission ID:', currentMissionId);
            if (currentMissionId && confirm('Are you sure you want to delete this mission?')) {
                let missions = JSON.parse(localStorage.getItem('missions')) || [];
                const initialMissionCount = missions.length;
                missions = missions.filter(m => m.id !== currentMissionId);
                
                if (missions.length < initialMissionCount) {
                    try {
                        localStorage.setItem('missions', JSON.stringify(missions));
                        console.log('DEBUG: Mission deleted from localStorage successfully. Remaining missions:', missions);
                        alert('Mission deleted successfully!');
                        window.location.href = '../index.html'; // 刪除後回到主頁
                    } catch (e) {
                        console.error('ERROR: Error deleting from localStorage:', e);
                        alert('Error deleting mission: ' + e.message);
                    }
                } else {
                    console.warn('Warning: Mission not found for deletion or array unchanged.', currentMissionId);
                    alert('Mission not found for deletion.');
                }
            } else if (!currentMissionId) {
                console.warn('Warning: Attempted to delete without a currentMissionId (not in edit mode).');
            }
        });
    } else {
        console.warn('Warning: Delete button element with ID "deleteMissionButton" not found.');
    }

    // 將 missionTitleInput 的值同步到 statebar 的 mission-name-title
    if (missionTitleInput && missionTitleDisplay) {
        missionTitleInput.addEventListener('input', () => {
            missionTitleDisplay.textContent = missionTitleInput.value || 'New Mission';
            console.log('DEBUG: Mission title display updated to:', missionTitleDisplay.textContent);
        });
    } else {
        console.warn('Warning: Mission title input or display element not found. Title sync disabled.');
    }
    console.log('--- mission.js: Initialization complete. ---');
});