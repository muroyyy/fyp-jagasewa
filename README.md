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
| **Infrastructure**   | AWS (EC2, S3, RDS, VPC, IAM, Route 53) | Cloud environment hosting the full stack                    |
| **IaC Tool**         | Terraform                              | Automates provisioning of cloud resources                   |
| **Containerization** | Docker + Docker Compose                | Ensures consistent runtime for frontend and backend         |
| **Version Control**  | GitHub + GitHub Actions                | CI/CD pipeline for automated build and deployment           |

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

## 📁 Project Structure
```
jagasewa-claude/
├── frontend/                 # ReactJS + Tailwind CSS (Vite)
│   ├── src/                  # Core source files (pages, components, assets)
│   ├── public/               # Static assets
│   ├── index.html            # Root HTML entry file
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
│
├── backend/                  # PHP RESTful API
│   ├── api/                  # Endpoint scripts (auth, property, tenant)
│   ├── config/               # Database and environment configuration
│   ├── models/               # PHP models (User, Tenant, Landlord)
│   ├── uploads/              # File uploads and documents
│   ├── Dockerfile            # Backend container configuration
│   └── composer.json         # PHP dependencies (if applicable)
│
├── infra/                    # Terraform Infrastructure as Code (IaC)
│   ├── main.tf               # Root Terraform configuration
│   ├── variables.tf          # Global variable definitions
│   ├── outputs.tf            # Root output values (RDS endpoint, EC2 IP, etc.)
│   ├── providers.tf          # AWS provider configuration
│   ├── user_data/            # EC2 initialization scripts (e.g., Docker setup)
│   ├── modules/              # Modular Terraform components
│   │   ├── vpc/              # Network, subnets, gateways
│   │   ├── ec2/              # Backend EC2 instance
│   │   ├── rds/              # MySQL database
│   │   ├── s3/               # Frontend hosting
│   │   ├── iam/              # IAM roles and permissions
│   │   └── security/         # Security groups and firewall rules
│   └── env/                  # Environment variable files
│       ├── dev.tfvars        # Development configuration
│       └── prod.tfvars       # Production configuration
│
├── docker-compose.yml        # Docker multi-container setup
├── .gitignore
├── package-lock.json
└── README.md
```

---

## 🔒 Security Highlights

- AWS IAM roles with least-privilege access
- Private subnets for RDS and backend EC2
- HTTPS via ALB / CloudFront
- Docker isolation between services
- Encrypted credentials stored in AWS SSM Parameter Stor

---

## 🧩 CI/CD Workflow

GitHub Actions automates:
- Build → React app build and backend lint check
- Package → Docker images built and tagged
- Deploy → Terraform applies changes to AWS infrastructure
