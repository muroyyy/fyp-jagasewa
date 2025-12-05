# 🚀 Rekognition Integration - Deployment Guide

## Prerequisites
- AWS account with Rekognition service available in `ap-southeast-1`
- Existing JagaSewa infrastructure deployed
- Access to RDS database

## Deployment Steps

### 1. Database Migration
Run the SQL migration to add AI analysis column:

```bash
mysql -h <RDS_ENDPOINT> -u <USERNAME> -p <DATABASE_NAME> < backend/migrations/add_ai_analysis_column.sql
```

### 2. Terraform Update
Apply IAM policy changes for Rekognition access:

```bash
cd infra
terraform plan
terraform apply
```

This adds `rekognition:DetectLabels` and `rekognition:DetectModerationLabels` permissions to EC2 role.

### 3. Backend Deployment
The backend changes will be automatically deployed via GitHub Actions on next push to `main`:

**New files:**
- `backend/config/rekognition_helper.php`
- `backend/api/tenant/analyze-maintenance-photo.php`

**Modified files:**
- `backend/api/tenant/submit-maintenance.php`

### 4. Frontend Deployment
Frontend changes will be automatically deployed via GitHub Actions:

**Modified files:**
- `frontend/src/pages/tenant/TenantMaintenance.jsx`

### 5. Verification

**Test the integration:**

1. Login as tenant
2. Navigate to Maintenance Requests
3. Click "New Request"
4. Upload a photo of damage (e.g., broken pipe, cracked wall)
5. Verify AI analysis appears with:
   - Suggested category
   - Severity level
   - Detected issues
   - Confidence score

**Check logs:**
```bash
# SSH to EC2 instance
aws ssm start-session --target <INSTANCE_ID>

# Check Docker logs
docker logs jagasewa-backend

# Look for Rekognition API calls
grep "Rekognition" /var/log/php-fpm.log
```

## Rollback Plan

If issues occur:

1. **Database**: Column is nullable, no data loss
2. **Backend**: Revert commit and redeploy
3. **IAM**: Remove Rekognition policy from Terraform

## Cost Monitoring

Monitor Rekognition usage in AWS Cost Explorer:
- Service: Amazon Rekognition
- API: DetectLabels, DetectModerationLabels
- Expected: <1000 requests/month = ~$1/month

## Troubleshooting

**Issue**: "AI analysis failed"
- Check EC2 IAM role has Rekognition permissions
- Verify AWS region is `ap-southeast-1`
- Check CloudWatch logs for Rekognition errors

**Issue**: Analysis not appearing
- Check browser console for API errors
- Verify image size <5MB
- Ensure valid image format (JPEG, PNG)

**Issue**: Wrong category suggestions
- Review `rekognition_helper.php` keyword mappings
- Adjust confidence thresholds
- Add more category keywords

## Performance

- **Analysis time**: 1-3 seconds per image
- **API latency**: ~500ms (Rekognition)
- **User experience**: Non-blocking (async analysis)
