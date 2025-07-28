package com.adobe.aem.guides.wknd.core.models;

import com.adobe.cq.wcm.core.components.models.Component;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Model(
    adaptables = SlingHttpServletRequest.class, 
    adapters = {VideoPlaylistModel.class, Component.class}, 
    resourceType = VideoPlaylistModel.RESOURCE_TYPE, 
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class VideoPlaylistModel implements Component {
    
    public static final String RESOURCE_TYPE = "wknd/components/videoplaylist";
    private static final Logger LOGGER = LoggerFactory.getLogger(VideoPlaylistModel.class);

    @Self
    private SlingHttpServletRequest request;

    @ValueMapValue
    private String videoDisplayType;

    @ValueMapValue
    private String commentMappingFile;

    @ValueMapValue
    private String id;

    @ValueMapValue(name = "allowAutoplay")
    private boolean allowAutoplay;

    @ValueMapValue(name = "maxVideos")
    private Integer maxVideos;

    private List<VideoItemModel> videoItems;
    private VideoItemModel currentVideo;

    @PostConstruct
    protected void init() {
        try {
            videoItems = new ArrayList<>();
            
            Resource currentResource = request.getResource();
            Resource videoItemsResource = currentResource.getChild("videoItems");
            
            if (videoItemsResource != null) {
                for (Resource itemResource : videoItemsResource.getChildren()) {
                    if (itemResource != null) {
                        VideoItemModel videoItem = itemResource.adaptTo(VideoItemModel.class);
                        if (videoItem != null && !videoItem.getVideoAssetPath().isEmpty()) {
                            videoItems.add(videoItem);
                        }
                    }
                }
            }

            if (maxVideos != null && maxVideos > 0 && videoItems.size() > maxVideos) {
                videoItems = videoItems.subList(0, maxVideos);
            }

            if (!videoItems.isEmpty()) {
                currentVideo = videoItems.get(0);
            }

            LOGGER.debug("VideoPlaylistModel initialized with {} items", videoItems.size());
        } catch (Exception e) {
            LOGGER.error("Error initializing VideoPlaylistModel", e);
            videoItems = Collections.emptyList();
        }
    }

    // Simplified JSON generation without Jackson
    public String getVideoItemsJson() {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < videoItems.size(); i++) {
            VideoItemModel item = videoItems.get(i);
            if (i > 0) {
                json.append(",");
            }
            json.append("{")
                .append("\"videoUrl\":\"").append(escapeJson(item.getVideoUrl())).append("\",")
                .append("\"customTitle\":\"").append(escapeJson(item.getCustomTitle())).append("\",")
                .append("\"customDescription\":\"").append(escapeJson(item.getCustomDescription())).append("\",")
                .append("\"posterImagePath\":\"").append(escapeJson(item.getPosterImagePath())).append("\",")
                .append("\"autoplay\":").append(item.isAutoplay()).append(",")
                .append("\"loop\":").append(item.isLoop()).append(",")
                .append("\"muted\":").append(item.isMuted())
                .append("}");
        }
        json.append("]");
        return json.toString();
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    // Getters
    public String getVideoDisplayType() {
        return Optional.ofNullable(videoDisplayType).orElse("desktop_16_9");
    }

    public List<VideoItemModel> getVideoItems() {
        return videoItems != null ? Collections.unmodifiableList(videoItems) : Collections.emptyList();
    }

    public String getCommentMappingFile() {
        return Optional.ofNullable(commentMappingFile).orElse("");
    }

    public VideoItemModel getCurrentVideo() {
        return currentVideo;
    }

    public boolean hasCurrentVideo() {
        return currentVideo != null;
    }

    public boolean isAllowAutoplay() {
        return allowAutoplay;
    }

    public Integer getMaxVideos() {
        return maxVideos;
    }

    public boolean hasVideoItems() {
        return videoItems != null && !videoItems.isEmpty();
    }

    public int getVideoCount() {
        return videoItems != null ? videoItems.size() : 0;
    }

    public String getResourceType() {
        return Optional.ofNullable(request)
                .map(SlingHttpServletRequest::getResource)
                .map(Resource::getResourceType)
                .orElse(RESOURCE_TYPE);
    }

    @Override
    public String getExportedType() {
        return getResourceType();
    }

    @Override
    public String getId() {
        return Optional.ofNullable(id).orElse("video-playlist-" + System.currentTimeMillis());
    }

    public String getComponentId() {
        return Optional.ofNullable(id).orElse("");
    }
}