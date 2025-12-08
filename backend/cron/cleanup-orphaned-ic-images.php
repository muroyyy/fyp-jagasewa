<?php
/**
 * Cleanup Orphaned IC Images
 * Run daily via cron to delete any IC images older than 1 hour
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;

$bucket = 'jagasewa-ic-verification';
$region = 'ap-southeast-1';
$maxAge = 3600; // 1 hour

try {
    $s3Client = new S3Client(['region' => $region, 'version' => 'latest']);
    $objects = $s3Client->listObjects(['Bucket' => $bucket, 'Prefix' => 'ic-verification/']);

    $deletedCount = 0;
    $currentTime = time();

    if (isset($objects['Contents'])) {
        foreach ($objects['Contents'] as $object) {
            $age = $currentTime - strtotime($object['LastModified']);
            if ($age > $maxAge) {
                $s3Client->deleteObject(['Bucket' => $bucket, 'Key' => $object['Key']]);
                $deletedCount++;
            }
        }
    }

    echo "Deleted $deletedCount orphaned IC images.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
