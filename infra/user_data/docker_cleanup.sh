#!/bin/bash
# Docker Image Cleanup Script - Keep only 10 most recent images
# Triggered automatically when image count exceeds 10

# Count jagasewa-backend images
IMAGE_COUNT=$(docker images | grep "jagasewa-backend" | wc -l)

if [ "$IMAGE_COUNT" -gt 10 ]; then
    echo "Found $IMAGE_COUNT images, cleaning up to keep only 10..."
    
    # Get old images to remove (keep newest 10)
    IMAGES_TO_REMOVE=$(docker images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
                       grep "jagasewa-backend" | \
                       sort -k2 -r | \
                       tail -n +11 | \
                       awk '{print $1}')
    
    if [ ! -z "$IMAGES_TO_REMOVE" ]; then
        echo "$IMAGES_TO_REMOVE" | while read image; do
            echo "Removing: $image"
            docker rmi "$image" 2>/dev/null || true
        done
        
        # Clean up dangling images
        docker system prune -f >/dev/null 2>&1
        
        NEW_COUNT=$(docker images | grep "jagasewa-backend" | wc -l)
        echo "Cleanup completed. Images: $IMAGE_COUNT -> $NEW_COUNT"
    fi
else
    echo "Image count ($IMAGE_COUNT) is within limit (10). No cleanup needed."
fi