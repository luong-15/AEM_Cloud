(function (document, window) {
    "use strict";

    /**
     * Video Playlist Component
     * Quản lý danh sách phát video với tính năng điều khiển đầy đủ
     */
    function VideoPlaylist(element) {
        // Kiểm tra phần tử tồn tại
        if (!element) {
            console.warn('VideoPlaylist: Element không tồn tại');
            return null;
        }

        // Properties
        this.element = element;
        this.video = null;
        this.items = null;
        this.title = null;
        this.description = null;
        this.videoData = [];
        this.currentIndex = 0;
        this.allowAutoplay = false;
        this.isInitialized = false;

        // Initialize
        this.initializeElements();
        this.initializeData();
        
        if (this.canInitialize()) {
            this.init();
        }
    }

    /**
     * Khởi tạo các DOM elements
     */
    VideoPlaylist.prototype.initializeElements = function() {
        try {
            this.video = this.element.querySelector('.cmp-videoplaylist__video');
            this.items = this.element.querySelectorAll('.cmp-videoplaylist__item');
            this.title = this.element.querySelector('.cmp-videoplaylist__title');
            this.description = this.element.querySelector('.cmp-videoplaylist__description');
            
            // Log trạng thái elements
            console.log('VideoPlaylist Elements:', {
                video: !!this.video,
                itemsCount: this.items ? this.items.length : 0,
                title: !!this.title,
                description: !!this.description
            });
            
        } catch (error) {
            console.error('VideoPlaylist: Lỗi khởi tạo elements:', error);
        }
    };

    /**
     * Khởi tạo dữ liệu component
     */
    VideoPlaylist.prototype.initializeData = function() {
        try {
            // Get allowAutoplay setting
            this.allowAutoplay = this.element.dataset.allowAutoplay === 'true';
            
            // Parse JSON data từ data attribute
            const videoItemsData = this.element.dataset.videoItems;
            if (videoItemsData) {
                try {
                    this.videoData = JSON.parse(videoItemsData);
                    console.log('VideoPlaylist: Parsed JSON data successfully, items:', this.videoData.length);
                } catch (parseError) {
                    console.warn('VideoPlaylist: Lỗi parse JSON, sử dụng fallback:', parseError);
                    this.videoData = this.extractVideoDataFromItems();
                }
            } else {
                // Fallback: extract từ DOM items
                this.videoData = this.extractVideoDataFromItems();
            }
            
            console.log('VideoPlaylist Data:', {
                allowAutoplay: this.allowAutoplay,
                videoCount: this.videoData.length
            });
            
        } catch (error) {
            console.error('VideoPlaylist: Lỗi khởi tạo data:', error);
            this.videoData = [];
        }
    };

    /**
     * Trích xuất dữ liệu video từ DOM items
     */
    VideoPlaylist.prototype.extractVideoDataFromItems = function() {
        const data = [];
        
        if (!this.items || this.items.length === 0) {
            console.warn('VideoPlaylist: Không có items để extract data');
            return data;
        }

        this.items.forEach((item, index) => {
            if (!item || !item.dataset) {
                console.warn(`VideoPlaylist: Item ${index} không hợp lệ`);
                return;
            }

            try {
                const videoItem = {
                    videoUrl: this.sanitizeUrl(item.dataset.videoUrl || ''),
                    customTitle: this.sanitizeText(item.dataset.videoTitle || ''),
                    customDescription: this.sanitizeText(item.dataset.videoDescription || ''),
                    posterImagePath: this.sanitizeUrl(item.dataset.videoPoster || ''),
                    autoplay: item.dataset.videoAutoplay === 'true',
                    loop: item.dataset.videoLoop === 'true',
                    muted: item.dataset.videoMuted === 'true',
                    captionPath: this.sanitizeUrl(item.dataset.videoCaptions || ''),
                    audioTrackPath: this.sanitizeUrl(item.dataset.videoAudioTrack || '')
                };
                
                // Chỉ thêm nếu có URL video hợp lệ
                if (videoItem.videoUrl) {
                    data.push(videoItem);
                } else {
                    console.warn(`VideoPlaylist: Item ${index} không có URL video hợp lệ`);
                }
                
            } catch (error) {
                console.warn(`VideoPlaylist: Lỗi xử lý item ${index}:`, error);
            }
        });
        
        console.log('VideoPlaylist: Extracted data from DOM items:', data.length);
        return data;
    };

    /**
     * Kiểm tra có thể khởi tạo component không
     */
    VideoPlaylist.prototype.canInitialize = function() {
        const hasVideo = !!this.video;
        const hasItems = this.items && this.items.length > 0;
        const hasData = this.videoData && this.videoData.length > 0;
        
        if (!hasVideo) {
            console.warn('VideoPlaylist: Không tìm thấy video element');
            return false;
        }
        
        if (!hasItems) {
            console.warn('VideoPlaylist: Không tìm thấy playlist items');
            return false;
        }
        
        if (!hasData) {
            console.warn('VideoPlaylist: Không có dữ liệu video');
            return false;
        }
        
        return true;
    };

    /**
     * Khởi tạo component chính
     */
    VideoPlaylist.prototype.init = function() {
        if (this.isInitialized) {
            console.warn('VideoPlaylist: Component đã được khởi tạo');
            return;
        }

        try {
            this.setupVideoElement();
            this.bindEvents();
            this.loadVideo(0);
            this.isInitialized = true;
            
            console.log('VideoPlaylist: Khởi tạo thành công');
            
            // Trigger custom event
            this.dispatchEvent('videoplaylist:initialized', {
                component: this,
                videoCount: this.videoData.length
            });
            
        } catch (error) {
            console.error('VideoPlaylist: Lỗi khởi tạo component:', error);
        }
    };

    /**
     * Cấu hình video element
     */
    VideoPlaylist.prototype.setupVideoElement = function() {
        if (!this.video) return;
        
        try {
            // Set default attributes
            this.video.controls = true;
            this.video.preload = 'metadata';
            
            // Thêm error handling cho video
            this.video.addEventListener('error', (e) => {
                console.error('VideoPlaylist: Video error:', e);
                this.handleVideoError(e);
            });
            
            this.video.addEventListener('loadstart', () => {
                console.log('VideoPlaylist: Video bắt đầu load');
            });
            
            this.video.addEventListener('canplay', () => {
                console.log('VideoPlaylist: Video sẵn sàng phát');
            });
            
        } catch (error) {
            console.error('VideoPlaylist: Lỗi setup video element:', error);
        }
    };

    /**
     * Bind tất cả events
     */
    VideoPlaylist.prototype.bindEvents = function() {
        this.bindPlaylistItemEvents();
        this.bindVideoEvents();
        this.bindKeyboardEvents();
    };

    /**
     * Bind events cho playlist items
     */
    VideoPlaylist.prototype.bindPlaylistItemEvents = function() {
        if (!this.items) return;

        this.items.forEach((item, index) => {
            if (!item) return;

            try {
                // Click event
                item.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.loadVideo(index);
                });

                // Keyboard support
                item.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        this.loadVideo(index);
                    }
                });

                // Mouse events for better UX
                item.addEventListener('mouseenter', () => {
                    item.classList.add('cmp-videoplaylist__item--hover');
                });

                item.addEventListener('mouseleave', () => {
                    item.classList.remove('cmp-videoplaylist__item--hover');
                });

                // Make item focusable
                if (!item.hasAttribute('tabindex')) {
                    item.setAttribute('tabindex', '0');
                }
                
            } catch (error) {
                console.warn(`VideoPlaylist: Lỗi bind events cho item ${index}:`, error);
            }
        });
    };

    /**
     * Bind events cho video element
     */
    VideoPlaylist.prototype.bindVideoEvents = function() {
        if (!this.video) return;

        try {
            // Video ended - auto next
            this.video.addEventListener('ended', () => {
                this.handleVideoEnded();
            });

            // Time update
            this.video.addEventListener('timeupdate', () => {
                this.handleTimeUpdate();
            });

            // Volume change
            this.video.addEventListener('volumechange', () => {
                this.handleVolumeChange();
            });

            // Play/Pause
            this.video.addEventListener('play', () => {
                this.dispatchEvent('videoplaylist:play', { index: this.currentIndex });
            });

            this.video.addEventListener('pause', () => {
                this.dispatchEvent('videoplaylist:pause', { index: this.currentIndex });
            });

            // Fullscreen
            this.video.addEventListener('fullscreenchange', () => {
                this.handleFullscreenChange();
            });

        } catch (error) {
            console.error('VideoPlaylist: Lỗi bind video events:', error);
        }
    };

    /**
     * Bind keyboard events cho toàn bộ component
     */
    VideoPlaylist.prototype.bindKeyboardEvents = function() {
        try {
            this.element.addEventListener('keydown', (event) => {
                if (!this.video) return;

                switch (event.key) {
                    case 'ArrowUp':
                        event.preventDefault();
                        this.previousVideo();
                        break;
                    case 'ArrowDown':
                        event.preventDefault();
                        this.nextVideo();
                        break;
                    case ' ':
                        if (event.target === this.element) {
                            event.preventDefault();
                            this.togglePlay();
                        }
                        break;
                }
            });
        } catch (error) {
            console.error('VideoPlaylist: Lỗi bind keyboard events:', error);
        }
    };

    /**
     * Load video tại index chỉ định
     */
    VideoPlaylist.prototype.loadVideo = function(index) {
        if (!this.isValidIndex(index) || !this.video) {
            console.warn('VideoPlaylist: Index không hợp lệ hoặc video element không tồn tại:', index);
            return false;
        }

        const data = this.videoData[index];
        if (!data || !data.videoUrl) {
            console.warn('VideoPlaylist: Dữ liệu video không hợp lệ:', index, data);
            return false;
        }

        try {
            // Pause current video
            if (!this.video.paused) {
                this.video.pause();
            }

            // Update current index trước khi load
            this.currentIndex = index;

            // Update video source
            this.updateVideoSource(data);
            
            // Update video attributes
            this.updateVideoAttributes(data);
            
            // Update UI
            this.updateVideoInfo(data);
            this.updateActiveState(index);
            
            // Load video
            this.video.load();
            
            // Auto play if allowed
            if (data.autoplay && this.allowAutoplay) {
                this.playVideoWithFallback();
            }
            
            // Dispatch event
            this.dispatchEvent('videoplaylist:videoloaded', {
                index: index,
                data: data
            });
            
            console.log(`VideoPlaylist: Loaded video ${index + 1}/${this.videoData.length}`);
            return true;
            
        } catch (error) {
            console.error('VideoPlaylist: Lỗi load video:', error);
            return false;
        }
    };

    /**
     * Update video source và related elements
     */
    VideoPlaylist.prototype.updateVideoSource = function(data) {
        if (!this.video || !data) return;

        // Update main source
        this.video.src = data.videoUrl;
        
        // Update poster
        if (data.posterImagePath) {
            this.video.poster = data.posterImagePath;
        } else {
            this.video.removeAttribute('poster');
        }

        // Handle captions/subtitles
        this.updateVideoTracks(data);
    };

    /**
     * Update video tracks (captions, audio)
     */
    VideoPlaylist.prototype.updateVideoTracks = function(data) {
        if (!this.video) return;

        try {
            // Remove existing tracks
            const existingTracks = this.video.querySelectorAll('track');
            existingTracks.forEach(track => {
                track.remove();
            });

            // Add caption track if available
            if (data.captionPath) {
                const track = document.createElement('track');
                track.kind = 'captions';
                track.src = data.captionPath;
                track.srclang = 'vi';
                track.label = 'Tiếng Việt';
                track.default = true;
                this.video.appendChild(track);
            }

        } catch (error) {
            console.warn('VideoPlaylist: Lỗi update video tracks:', error);
        }
    };

    /**
     * Update video attributes
     */
    VideoPlaylist.prototype.updateVideoAttributes = function(data) {
        if (!this.video || !data) return;

        try {
            this.video.loop = data.loop || false;
            this.video.muted = data.muted || false;
            
            // Update other attributes if needed
            if (data.volume !== undefined && data.volume >= 0 && data.volume <= 1) {
                this.video.volume = data.volume;
            }
            
        } catch (error) {
            console.warn('VideoPlaylist: Lỗi update video attributes:', error);
        }
    };

    /**
     * Update video info display
     */
    VideoPlaylist.prototype.updateVideoInfo = function(data) {
        try {
            if (this.title) {
                this.title.textContent = data.customTitle || `Video ${this.currentIndex + 1}`;
            }
            
            if (this.description) {
                this.description.textContent = data.customDescription || '';
                // Ẩn description nếu không có nội dung
                this.description.style.display = data.customDescription ? 'block' : 'none';
            }
        } catch (error) {
            console.warn('VideoPlaylist: Lỗi update video info:', error);
        }
    };

    /**
     * Update active state cho playlist items
     */
    VideoPlaylist.prototype.updateActiveState = function(activeIndex) {
        if (!this.items) return;

        this.items.forEach((item, index) => {
            if (!item) return;

            try {
                const isActive = index === activeIndex;
                
                // Update classes
                item.classList.toggle('cmp-videoplaylist__item--active', isActive);
                
                // Update indicator
                const indicator = item.querySelector('.cmp-videoplaylist__item-indicator');
                if (indicator) {
                    indicator.classList.toggle('playing', isActive);
                }

                // Update aria attributes
                item.setAttribute('aria-selected', isActive.toString());
                
                // Scroll into view if active and not visible
                if (isActive) {
                    this.scrollItemIntoView(item);
                }
                
            } catch (error) {
                console.warn(`VideoPlaylist: Lỗi update active state cho item ${index}:`, error);
            }
        });
    };

    /**
     * Scroll item into view nếu cần
     */
    VideoPlaylist.prototype.scrollItemIntoView = function(item) {
        try {
            if (item && typeof item.scrollIntoView === 'function') {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        } catch (error) {
            console.warn('VideoPlaylist: Lỗi scroll item into view:', error);
        }
    };

    /**
     * Play video với error handling
     */
    VideoPlaylist.prototype.playVideoWithFallback = function() {
        if (!this.video) return;

        try {
            const playPromise = this.video.play();
            
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch((error) => {
                    console.warn('VideoPlaylist: Autoplay bị chặn:', error.message);
                    // Có thể hiển thị thông báo cho user
                    this.handleAutoplayBlocked();
                });
            }
        } catch (error) {
            console.warn('VideoPlaylist: Lỗi play video:', error);
        }
    };

    /**
     * Handle khi video ended
     */
    VideoPlaylist.prototype.handleVideoEnded = function() {
        console.log('VideoPlaylist: Video ended, current index:', this.currentIndex);
        
        // Dispatch event
        this.dispatchEvent('videoplaylist:ended', { 
            index: this.currentIndex 
        });
        
        // Auto next video nếu không phải video cuối
        if (this.hasNextVideo()) {
            setTimeout(() => {
                this.nextVideo();
            }, 1000); // Delay 1 giây
        } else {
            // Playlist ended
            this.dispatchEvent('videoplaylist:playlistended');
            console.log('VideoPlaylist: Playlist đã kết thúc');
        }
    };

    /**
     * Handle video error
     */
    VideoPlaylist.prototype.handleVideoError = function(event) {
        const error = this.video.error;
        let errorMessage = 'Lỗi không xác định';
        
        if (error) {
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                    errorMessage = 'Video bị hủy bỏ';
                    break;
                case error.MEDIA_ERR_NETWORK:
                    errorMessage = 'Lỗi mạng khi tải video';
                    break;
                case error.MEDIA_ERR_DECODE:
                    errorMessage = 'Lỗi decode video';
                    break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Định dạng video không được hỗ trợ';
                    break;
            }
        }
        
        console.error('VideoPlaylist: Video error:', errorMessage, error);
        
        // Dispatch error event
        this.dispatchEvent('videoplaylist:error', {
            index: this.currentIndex,
            error: error,
            message: errorMessage
        });
        
        // Try next video after error
        if (this.hasNextVideo()) {
            setTimeout(() => {
                console.log('VideoPlaylist: Trying next video after error');
                this.nextVideo();
            }, 2000);
        }
    };

    /**
     * Handle autoplay blocked
     */
    VideoPlaylist.prototype.handleAutoplayBlocked = function() {
        console.log('VideoPlaylist: Autoplay blocked, showing play button');
        
        // Dispatch event để UI có thể hiển thị nút play
        this.dispatchEvent('videoplaylist:autoplayblocked', {
            index: this.currentIndex
        });
    };

    /**
     * Handle time update
     */
    VideoPlaylist.prototype.handleTimeUpdate = function() {
        if (!this.video) return;
        
        // Dispatch progress event
        this.dispatchEvent('videoplaylist:timeupdate', {
            currentTime: this.video.currentTime,
            duration: this.video.duration,
            progress: this.video.duration ? (this.video.currentTime / this.video.duration) : 0
        });
    };

    /**
     * Handle volume change
     */
    VideoPlaylist.prototype.handleVolumeChange = function() {
        if (!this.video) return;
        
        this.dispatchEvent('videoplaylist:volumechange', {
            volume: this.video.volume,
            muted: this.video.muted
        });
    };

    /**
     * Handle fullscreen change
     */
    VideoPlaylist.prototype.handleFullscreenChange = function() {
        const isFullscreen = document.fullscreenElement === this.video;
        
        this.dispatchEvent('videoplaylist:fullscreenchange', {
            isFullscreen: isFullscreen
        });
    };

    // Navigation methods
    
    /**
     * Next video
     */
    VideoPlaylist.prototype.nextVideo = function() {
        const nextIndex = this.currentIndex + 1;
        if (this.isValidIndex(nextIndex)) {
            this.loadVideo(nextIndex);
        }
    };

    /**
     * Previous video
     */
    VideoPlaylist.prototype.previousVideo = function() {
        const prevIndex = this.currentIndex - 1;
        if (this.isValidIndex(prevIndex)) {
            this.loadVideo(prevIndex);
        }
    };

    /**
     * Toggle play/pause
     */
    VideoPlaylist.prototype.togglePlay = function() {
        if (!this.video) return;
        
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    };

    // Utility methods
    
    /**
     * Kiểm tra index hợp lệ
     */
    VideoPlaylist.prototype.isValidIndex = function(index) {
        return typeof index === 'number' && 
               index >= 0 && 
               index < this.videoData.length;
    };

    /**
     * Kiểm tra có video tiếp theo
     */
    VideoPlaylist.prototype.hasNextVideo = function() {
        return this.isValidIndex(this.currentIndex + 1);
    };

    /**
     * Kiểm tra có video trước
     */
    VideoPlaylist.prototype.hasPreviousVideo = function() {
        return this.isValidIndex(this.currentIndex - 1);
    };

    /**
     * Sanitize URL
     */
    VideoPlaylist.prototype.sanitizeUrl = function(url) {
        if (typeof url !== 'string') return '';
        return url.trim();
    };

    /**
     * Sanitize text
     */
    VideoPlaylist.prototype.sanitizeText = function(text) {
        if (typeof text !== 'string') return '';
        return text.trim();
    };

    /**
     * Dispatch custom event
     */
    VideoPlaylist.prototype.dispatchEvent = function(eventName, detail = {}) {
        try {
            const event = new CustomEvent(eventName, {
                detail: detail,
                bubbles: true,
                cancelable: true
            });
            this.element.dispatchEvent(event);
        } catch (error) {
            console.warn('VideoPlaylist: Lỗi dispatch event:', eventName, error);
        }
    };

    // Public API methods
    
    /**
     * Destroy component
     */
    VideoPlaylist.prototype.destroy = function() {
        try {
            // Remove event listeners
            if (this.video) {
                this.video.pause();
                this.video.src = '';
                this.video.load();
            }
            
            // Clear references
            this.element = null;
            this.video = null;
            this.items = null;
            this.title = null;
            this.description = null;
            this.videoData = [];
            this.isInitialized = false;
            
            console.log('VideoPlaylist: Component destroyed');
            
        } catch (error) {
            console.error('VideoPlaylist: Lỗi destroy component:', error);
        }
    };

    /**
     * Get current video data
     */
    VideoPlaylist.prototype.getCurrentVideo = function() {
        return this.videoData[this.currentIndex] || null;
    };

    /**
     * Get all video data
     */
    VideoPlaylist.prototype.getAllVideos = function() {
        return [...this.videoData];
    };

    /**
     * Get component state
     */
    VideoPlaylist.prototype.getState = function() {
        return {
            currentIndex: this.currentIndex,
            videoCount: this.videoData.length,
            isInitialized: this.isInitialized,
            allowAutoplay: this.allowAutoplay,
            hasVideo: !!this.video,
            videoState: this.video ? {
                paused: this.video.paused,
                ended: this.video.ended,
                currentTime: this.video.currentTime,
                duration: this.video.duration,
                volume: this.video.volume,
                muted: this.video.muted
            } : null
        };
    };

    // Static methods for initialization
    
    /**
     * Initialize all video playlist components on page
     */
    function initVideoPlaylists() {
        try {
            const components = document.querySelectorAll('.cmp-videoplaylist');
            
            if (!components || components.length === 0) {
                console.log('VideoPlaylist: Không tìm thấy component nào');
                return [];
            }

            console.log(`VideoPlaylist: Khởi tạo ${components.length} component(s)`);
            
            const instances = [];
            components.forEach((component, index) => {
                try {
                    const instance = new VideoPlaylist(component);
                    if (instance && instance.isInitialized) {
                        instances.push(instance);
                        // Store instance reference
                        component._videoPlaylistInstance = instance;
                    }
                } catch (error) {
                    console.error(`VideoPlaylist: Lỗi khởi tạo component ${index}:`, error);
                }
            });
            
            console.log(`VideoPlaylist: Khởi tạo thành công ${instances.length} component(s)`);
            return instances;
            
        } catch (error) {
            console.error('VideoPlaylist: Lỗi tổng quát khi khởi tạo:', error);
            return [];
        }
    }

    /**
     * Get instance from element
     */
    function getInstanceFromElement(element) {
        return element && element._videoPlaylistInstance ? element._videoPlaylistInstance : null;
    }

    /**
     * Destroy all instances
     */
    function destroyAllInstances() {
        const components = document.querySelectorAll('.cmp-videoplaylist');
        components.forEach(component => {
            const instance = getInstanceFromElement(component);
            if (instance) {
                instance.destroy();
                component._videoPlaylistInstance = null;
            }
        });
    }

    // Auto-initialize when DOM is ready
    function autoInit() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initVideoPlaylists);
        } else {
            // DOM đã sẵn sàng
            initVideoPlaylists();
        }
    }

    // Initialize
    autoInit();

    // Export API to window object
    if (typeof window !== 'undefined') {
        window.VideoPlaylist = {
            // Constructor
            VideoPlaylist: VideoPlaylist,
            
            // Static methods
            init: initVideoPlaylists,
            getInstance: getInstanceFromElement,
            destroyAll: destroyAllInstances,
            
            // Version
            version: '1.0.0'
        };
    }

    // AMD/CommonJS support
    if (typeof define === 'function' && define.amd) {
        define('VideoPlaylist', [], function() {
            return VideoPlaylist;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = VideoPlaylist;
    }

})(document, window);