document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------
    // 用戶名儲存功能 (與之前的方案相同)
    // -----------------------------------------------------------
    const userNameDisplay = document.getElementById('userNameDisplay');
    const defaultUserName = 'User Name';

    const savedUserName = localStorage.getItem('userName');
    if (savedUserName) {
        userNameDisplay.textContent = savedUserName;
    } else {
        userNameDisplay.textContent = defaultUserName;
    }

    userNameDisplay.addEventListener('blur', () => {
        const currentName = userNameDisplay.textContent.trim();
        if (currentName === '') {
            userNameDisplay.textContent = savedUserName || defaultUserName;
        } else {
            localStorage.setItem('userName', currentName);
            console.log('User name saved:', currentName);
        }
    });

    userNameDisplay.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            userNameDisplay.blur();
        }
    });

    // -----------------------------------------------------------
    // 任務列表管理
    // -----------------------------------------------------------
    const missionList = document.getElementById('missionList');
    const addMissionButton = document.getElementById('addMissionButton');

    // 載入任務的函數
    function loadMissions() {
        missionList.innerHTML = ''; // 清空現有列表

        // 從 localStorage 獲取任務列表
        const missions = JSON.parse(localStorage.getItem('missions')) || [];

        if (missions.length === 0) {
            // 如果沒有任務，可以顯示一個提示或者預設任務
            const noMissionItem = document.createElement('li');
            noMissionItem.className = 'mission-item';
            noMissionItem.innerHTML = `
                <div class="mission-details" style="text-align: center; width: 100%;">
                    <h3 class="mission-text" style="color: #b0b0b0;">No Missions Yet. Click '+' to add one!</h3>
                </div>
            `;
            missionList.appendChild(noMissionItem);
            return;
        }

        // 遍歷任務陣列，為每個任務創建列表項
        missions.forEach(mission => {
            const listItem = document.createElement('li');
            listItem.className = 'mission-item';
            listItem.setAttribute('data-mission-id', mission.id); // 儲存任務ID
            listItem.innerHTML = `
                <img src="img/missionicon.png" class="mission-icon" alt="Mission Icon">
                <div class="mission-details">
                    <h3 class="mission-text">${mission.title}</h3>
                    <p class="mission-desc">${mission.description}</p>
                    <p class="mission-date">Date: ${mission.date}</p>
                </div>
            `;
            // 添加點擊事件，用於編輯任務 (稍後實現)
            listItem.addEventListener('click', () => {
                // 跳轉到任務設定頁面，並傳遞任務ID
                window.location.href = `Pages/mission-setting.html?id=${mission.id}`;
            });
            missionList.appendChild(listItem);
        });
    }

    // 當頁面載入時載入任務
    loadMissions();

    // 為新增任務按鈕添加事件監聽器
    addMissionButton.addEventListener('click', () => {
        window.location.href = 'Pages/mission-setting.html'; // 跳轉到任務設定頁面 (不帶ID，表示新增)
    });
});