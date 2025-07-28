package com.adobe.aem.guides.wknd.core.models;

import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.Rendition;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Model(
    adaptables = Resource.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class VideoItemModel {
    private static final Logger LOGGER = LoggerFactory.getLogger(VideoItemModel.class);

    @Self
    private Resource resource;

    @ValueMapValue
    private String videoAssetPath;
    
    @ValueMapValue
    private String customTitle;
    
    @ValueMapValue
    private String customDescription;
    
    @ValueMapValue
    private String captionPath;
    
    @ValueMapValue
    private String audioTrackPath;
    
    @ValueMapValue
    private String posterImagePath;
    
    @ValueMapValue(name = "autoplay")
    private boolean autoplay;
    
    @ValueMapValue(name = "loop")
    private boolean loop;
    
    @ValueMapValue(name = "muted")
    private boolean muted;
    
    @ValueMapValue
    private String viewerPreset;

    private Asset videoAsset;

    @PostConstruct
    protected void init() {
        try {
            if (videoAssetPath != null && resource != null) {
                ResourceResolver resolver = resource.getResourceResolver();
                Resource assetResource = resolver.getResource(videoAssetPath);
                if (assetResource != null) {
                    videoAsset = assetResource.adaptTo(Asset.class);
                }
            }
        } catch (Exception e) {
            LOGGER.error("Error initializing VideoItemModel", e);
        }
    }

    public Asset getVideoAsset() {
        return videoAsset;
    }

    public String getVideoUrl() {
        return Optional.ofNullable(videoAsset)
                      .map(Asset::getOriginal)
                      .map(Rendition::getPath)
                      .filter(path -> !path.isEmpty())
                      .orElse("");
    }

    // Getters with null checks
    public String getVideoAssetPath() { 
        return Optional.ofNullable(videoAssetPath).orElse(""); 
    }
    
    public String getCustomTitle() { 
        return Optional.ofNullable(customTitle).orElse(getVideoAssetPath()); 
    }
    
    public String getCustomDescription() { 
        return Optional.ofNullable(customDescription).orElse(""); 
    }
    
    public String getCaptionPath() { 
        return Optional.ofNullable(captionPath).orElse(""); 
    }
    
    public String getAudioTrackPath() { 
        return Optional.ofNullable(audioTrackPath).orElse(""); 
    }
    
    public String getPosterImagePath() { 
        return Optional.ofNullable(posterImagePath).orElse(""); 
    }
    
    public boolean isAutoplay() { return autoplay; }
    public boolean isLoop() { return loop; }
    public boolean isMuted() { return muted; }
    
    public String getViewerPreset() { 
        return Optional.ofNullable(viewerPreset).orElse(""); 
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("videoUrl", getVideoUrl());
        map.put("customTitle", getCustomTitle());
        map.put("customDescription", getCustomDescription());
        map.put("posterImagePath", getPosterImagePath());
        map.put("autoplay", isAutoplay());
        map.put("loop", isLoop());
        map.put("muted", isMuted());
        return map;
    }
}