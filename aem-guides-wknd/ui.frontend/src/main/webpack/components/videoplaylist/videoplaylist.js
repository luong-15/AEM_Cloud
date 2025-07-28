(function (document) {
    "use strict";

    function VideoPlaylist(element) {
        if (!element) return;

        this.element = element;
        this.video = element.querySelector('.cmp-videoplaylist__video');
        this.items = element.querySelectorAll('.cmp-videoplaylist__item');
        this.title = element.querySelector('.cmp-videoplaylist__title');
        this.description = element.querySelector('.cmp-videoplaylist__description');

        // Get allowAutoplay setting from data attribute on component element
        this.allowAutoplay = element.dataset.allowAutoplay === 'true';

        // Parse JSON data or extract from data attributes
        try {
            this.videoData = JSON.parse(element.dataset.videoItems || '[]');
        } catch (e) {
            // Fallback: extract from individual items
            this.videoData = this.extractVideoDataFromItems();
        }

        this.init();
    }

    VideoPlaylist.prototype.extractVideoDataFromItems = function () {
        const data = [];
        this.items.forEach(item => {
            data.push({
                videoUrl: item.dataset.videoUrl || '',
                customTitle: item.dataset.videoTitle || '',
                customDescription: item.dataset.videoDescription || '',
                posterImagePath: item.dataset.videoPoster || '',
                autoplay: item.dataset.videoAutoplay === 'true',
                loop: item.dataset.videoLoop === 'true',
                muted: item.dataset.videoMuted === 'true'
            });
        });
        return data;
    };

    VideoPlaylist.prototype.init = function () {
        if (!this.video || !this.items.length) return;

        this.bindEvents();
        this.loadVideo(0);
    };

    VideoPlaylist.prototype.bindEvents = function () {
        this.items.forEach((item, index) => {
            item.addEventListener('click', () => this.loadVideo(index));
        });
    };

    VideoPlaylist.prototype.loadVideo = function (index) {
        if (!this.videoData[index] || !this.video) {
            console.warn('Invalid video index or video element not found:', index);
            return;
        }

        const data = this.videoData[index];

        try {
            // Update video source and attributes
            this.video.src = data.videoUrl;
            this.video.poster = data.posterImagePath || '';

            // Update metadata
            if (this.title) {
                this.title.textContent = data.customTitle || '';
            }
            if (this.description) {
                this.description.textContent = data.customDescription || '';
            }

            // Update active state
            this.items.forEach(item => {
                item.classList.remove('cmp-videoplaylist__item--active');
            });
            this.items[index].classList.add('cmp-videoplaylist__item--active');

            // Load and play video
            this.video.load();
            if (data.autoplay && this.allowAutoplay) {
                const playPromise = this.video.play();
                if (playPromise) {
                    playPromise.catch(() => {
                        console.warn('Autoplay prevented by browser');
                    });
                }
            }
        } catch (error) {
            console.error('Error loading video:', error);
        }

    };

    // Initialize all video playlist components
    function initVideoPlaylists() {
        const components = document.querySelectorAll('.cmp-videoplaylist');
        components.forEach(component => new VideoPlaylist(component));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoPlaylists);
    } else {
        initVideoPlaylists();
    }


})(document);
