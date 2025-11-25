# 🏠 JagaSewa – Cloud-Based Rental Management System

## 👨‍💻 Developer: Amirul Faiz bin Mohd Redzuan

- Institution: Asia Pacific University of Technology & Innovation (APU)
- Programme: BSc (Hons) in Information Technology with a Specialism in Cloud Engineering
- Project Type: Final Year Project (FYP)

---

## 📋 Project Overview

JagaSewa is a full-stack web platform that simplifies property management for landlords and tenants.
The system enables:
- Landlords to manage property listings, rental applications, and tenant feedback.
- Tenants to browse available rentals, submit applications, and communicate with property owners.

The system is containerized with Docker, deployed on AWS Cloud, and provisioned using Terraform (IaC) for scalability, automation, and reliability.

---

## ⚙️ Technology Stack

| Layer                | Technology                             | Description                                                 |
| -------------------- | -------------------------------------- | ----------------------------------------------------------- |
| **Frontend**         | ReactJS + Tailwind CSS + Vite          | Modern SPA with responsive design                           |
| **Backend**          | PHP (RESTful API)                      | Handles authentication, CRUD operations, and business logic |
| **Database**         | MySQL (AWS RDS)                        | Stores user, property, and rental data                      |
| **Infrastructure**   | AWS (EC2, S3, RDS, VPC, IAM, Route 53, CloudFront, ECR) | Cloud environment hosting the full stack                    |
| **IaC Tool**         | Terraform                              | Automates provisioning of cloud resources                   |
| **Containerization** | Docker                                 | Backend containerization with Docker images                 |
| **CI/CD**            | GitHub Actions                         | Automated build and deployment pipeline                     |
| **Version Control**  | GitHub                                 | Source code management and collaboration                    |

---

## 🚀 Features

🏠 For Landlords
- Property listing management
- Rental application tracking
- Tenant communication and feedback
- Automated rent tracking and reports

👤 For Tenants
- Account registration and login
- Browse and apply for properties
- View rental history and payments
- Provide ratings and comments



## 🔒 Security Highlights

- AWS IAM roles with least-privilege access
- Private subnets for RDS and backend EC2
- HTTPS via ALB / CloudFront
- Docker isolation between services
- Encrypted credentials stored in AWS SSM Parameter Store
- Secrets management via GitHub Secrets and AWS Secrets Manager

---

## 🧩 CI/CD Workflow

The project implements an automated CI/CD pipeline using **GitHub Actions** that triggers on every push to the `main` branch, deploying both frontend and backend to AWS infrastructure.

### Frontend Deployment Pipeline

**Trigger**: Push to `main` branch

1. **Build Stage**
   - Installs dependencies using `npm install`
   - Builds optimized production bundle with `npm run build`
   - Generates static files ready for deployment

2. **Deploy to S3**
   - Uploads build artifacts to AWS S3 bucket
   - S3 bucket configured for static website hosting
   - Files are publicly accessible through S3

3. **CloudFront Distribution**
   - S3 serves frontend files through CloudFront CDN
   - CloudFront provides global content delivery
   - HTTPS enabled with SSL/TLS certificate
   - Custom domain: **jagasewa.cloud**
   - Route 53 DNS configured to point to CloudFront distribution

### Backend Deployment Pipeline

**Trigger**: Push to `main` branch

1. **Build Docker Image**
   - Creates Docker image for PHP backend
   - Includes all dependencies and configurations
   - Tags image with commit SHA for version tracking

2. **Push to Amazon ECR**
   - Authenticates with Amazon Elastic Container Registry
   - Pushes Docker image to ECR repository
   - Maintains image versioning for rollback capability

3. **Deploy to EC2**
   - EC2 instance pulls latest Docker image from ECR
   - Stops existing container (if running)
   - Runs new container with updated image
   - Backend API accessible through EC2 instance
   - Connects to RDS MySQL database

### Infrastructure Components

- **Frontend**: S3 + CloudFront + Route 53 (jagasewa.cloud)
- **Backend**: EC2 + Docker + ECR
- **Database**: AWS RDS (MySQL)
- **Storage**: S3 for property images and documents
- **Networking**: VPC with public/private subnets
- **Security**: IAM roles, Security Groups, SSL/TLS certificates

### Deployment Flow

```
GitHub Push (main) → GitHub Actions
                          |
        +-----------------+-----------------+
        |                                   |
    Frontend                            Backend
        |                                   |
    npm build                      Docker build
        |                                   |
    Upload to S3                   Push to ECR
        |                                   |
    CloudFront CDN                 EC2 pulls image
        |                                   |
  jagasewa.cloud                   Run container
```
