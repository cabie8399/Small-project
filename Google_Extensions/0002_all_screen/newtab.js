// 這裡可以添加任何JavaScript功能 

class BookmarkManager {
    constructor() {
        this.currentPath = [];
        this.initializeEventListeners();
        this.loadBookmarks();
    }

    initializeEventListeners() {
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        document.addEventListener('click', () => this.hideContextMenu());
        
        document.getElementById('newFolder').addEventListener('click', () => this.showFolderDialog());
        document.getElementById('newBookmark').addEventListener('click', () => this.showBookmarkDialog());
        
        document.getElementById('saveFolder').addEventListener('click', () => this.createFolder());
        document.getElementById('saveBookmark').addEventListener('click', () => this.createBookmark());
        
        document.getElementById('cancelFolder').addEventListener('click', () => this.hideDialog('folderDialog'));
        document.getElementById('cancelBookmark').addEventListener('click', () => this.hideDialog('bookmarkDialog'));
    }

    async loadBookmarks() {
        const desktop = document.getElementById('desktop');
        desktop.innerHTML = '';

        // 如果在子資料夾中，顯示返回按鈕
        if (this.currentPath.length > 0) {
            this.createBackButton();
        }

        // 從 chrome.storage 讀取書籤數據
        chrome.storage.local.get(['bookmarks'], (result) => {
            const bookmarks = result.bookmarks || this.getInitialBookmarks();
            const currentFolder = this.getCurrentFolder(bookmarks);
            
            for (const item of currentFolder.items) {
                this.createIcon(item);
            }
        });
    }

    getInitialBookmarks() {
        const initialBookmarks = {
            items: []
        };
        chrome.storage.local.set({ bookmarks: initialBookmarks });
        return initialBookmarks;
    }

    getCurrentFolder(bookmarks) {
        let current = bookmarks;
        for (const pathItem of this.currentPath) {
            current = current.items.find(item => item.id === pathItem);
        }
        return current;
    }

    createBackButton() {
        const backIcon = document.createElement('div');
        backIcon.className = 'icon';
        backIcon.innerHTML = `
            <i class="fas fa-arrow-left"></i>
            <span class="icon-name">返回上層</span>
        `;
        backIcon.addEventListener('click', () => {
            this.currentPath.pop();
            this.loadBookmarks();
        });
        document.getElementById('desktop').appendChild(backIcon);
    }

    createIcon(item) {
        const icon = document.createElement('div');
        icon.className = 'icon';
        icon.innerHTML = `
            <i class="fas ${item.type === 'folder' ? 'fa-folder' : 'fa-bookmark'}"></i>
            <span class="icon-name">${item.name}</span>
        `;

        icon.addEventListener('click', () => {
            if (item.type === 'folder') {
                this.currentPath.push(item.id);
                this.loadBookmarks();
            } else {
                window.location.href = item.url;
            }
        });

        document.getElementById('desktop').appendChild(icon);
    }

    handleContextMenu(e) {
        e.preventDefault();
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
    }

    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }

    showDialog(dialogId) {
        document.getElementById(dialogId).style.display = 'flex';
    }

    hideDialog(dialogId) {
        document.getElementById(dialogId).style.display = 'none';
    }

    showFolderDialog() {
        this.hideContextMenu();
        this.showDialog('folderDialog');
    }

    showBookmarkDialog() {
        this.hideContextMenu();
        this.showDialog('bookmarkDialog');
    }

    async createFolder() {
        const folderName = document.getElementById('folderName').value;
        if (!folderName) return;

        const folder = {
            id: Date.now().toString(),
            name: folderName,
            type: 'folder',
            items: []
        };

        await this.addItem(folder);
        this.hideDialog('folderDialog');
        document.getElementById('folderName').value = '';
        this.loadBookmarks();
    }

    async createBookmark() {
        const title = document.getElementById('bookmarkTitle').value;
        const url = document.getElementById('bookmarkUrl').value;
        if (!title || !url) return;

        const bookmark = {
            id: Date.now().toString(),
            name: title,
            type: 'bookmark',
            url: url
        };

        await this.addItem(bookmark);
        this.hideDialog('bookmarkDialog');
        document.getElementById('bookmarkTitle').value = '';
        document.getElementById('bookmarkUrl').value = '';
        this.loadBookmarks();
    }

    async addItem(item) {
        const result = await chrome.storage.local.get(['bookmarks']);
        let bookmarks = result.bookmarks || this.getInitialBookmarks();
        
        let current = bookmarks;
        for (const pathItem of this.currentPath) {
            current = current.items.find(item => item.id === pathItem);
        }
        
        current.items.push(item);
        await chrome.storage.local.set({ bookmarks });
    }
}

// 初始化書籤管理器
new BookmarkManager(); 