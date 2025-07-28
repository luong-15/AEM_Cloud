package com.adobe.aem.guides.wknd.core.models;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.adobe.cq.wcm.core.components.models.Component;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
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

@Model(adaptables = SlingHttpServletRequest.class, 
       adapters = {VideoPlaylistModel.class, Component.class}, 
       resourceType = "wknd/components/videoplaylist", 
       defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class VideoPlaylistModel implements Component {
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
            
            // Lấy resource hiện tại
            Resource currentResource = request.getResource();
            
            // Tìm resource videoItems trong multifield
            Resource videoItemsResource = currentResource.getChild("videoItems");
            if (videoItemsResource != null) {
                // Duyệt qua tất cả các item trong multifield
                for (Resource itemResource : videoItemsResource.getChildren()) {
                    if (itemResource != null) {
                        // Adapt mỗi resource thành VideoItemModel
                        VideoItemModel videoItem = itemResource.adaptTo(VideoItemModel.class);
                        if (videoItem != null && !videoItem.getVideoAssetPath().isEmpty()) {
                            videoItems.add(videoItem);
                        }
                    }
                }
            }

            // Enforce maxVideos limit if set
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

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public String getVideoItemsJson() {
        try {
            List<Object> videoItemsData = new ArrayList<>();
            for (VideoItemModel item : videoItems) {
                videoItemsData.add(item.toMap());
            }
            return OBJECT_MAPPER.writeValueAsString(videoItemsData);
        } catch (JsonProcessingException e) {
            LOGGER.error("Error converting video items to JSON", e);
            return "[]";
        }
    }

    // Getters with null checks
    public String getVideoDisplayType() {
        return Optional.ofNullable(videoDisplayType).orElse("desktop_16_9");
    }

    public List<VideoItemModel> getVideoItems() {
        return Collections.unmodifiableList(videoItems);
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
        return !videoItems.isEmpty();
    }

    public int getVideoCount() {
        return videoItems.size();
    }

    public String getResourceType() {
        return Optional.ofNullable(request)
                .map(SlingHttpServletRequest::getResource)
                .map(Resource::getResourceType)
                .orElse("wknd/components/videoplaylist");
    }

    @Override
    public String getExportedType() {
        return getResourceType();
    }

    @Override
    public String getId() {
        return Optional.ofNullable(id).orElse("video-playlist-" + System.currentTimeMillis());
    }

    // Getter cho field id (không trùng với Component.getId())
    public String getComponentId() {
        return Optional.ofNullable(id).orElse("");
    }
}