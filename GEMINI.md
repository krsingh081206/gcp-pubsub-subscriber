# Node.js + GCP Pub/Sub Order Subscriber

## Project Introduction

This project is a **Order Event Subscriber** backend built with Node.js and the GCP Pub/Sub Library. It continuously consumes messages from a Google Cloud Pub/Sub topic and persists the orders in postgres database using sequelize library . The application should maintain different tables for entities like customer, order items, and shipping address. Below is a sample payload for PubSub Message. Every Pubsub Message represents an order event.

```json
{
  "orderId": "9fa0b37b-b559-4173-b49b-b806b1f8145d",
  "timestamp": "2026-04-05T16:11:44.728Z",
  "customer": {
    "name": "Hannah Cole",
    "email": "Otilia_Murray@hotmail.com"
  },
  "items": [
    {
      "productId": "0koo8Ucsix",
      "productName": "Handmade Plastic Hat",
      "quantity": 1,
      "price": 419
    },
    {
      "productId": "XYBlyMWoJF",
      "productName": "Sleek Metal Shoes",
      "quantity": 3,
      "price": 758
    },
    {
      "productId": "RjZClrAQ2n",
      "productName": "Oriental Wooden Keyboard",
      "quantity": 1,
      "price": 909
    }
  ],
  "totalAmount": 3602,
  "shippingAddress": {
    "street": "5138 White Mission",
    "city": "Fort Darron",
    "zipCode": "59501-7413",
    "country": "Zambia"
  }
}
```

The application is designed to be deployed on Google Kubernetes Engine (GKE) and adheres to 12-factor app principles, including configuration via environment variables, structured logging, and stateless processes.

The order events consumed by this application are intended to be  persisted  into a database like PostgreSQL. The subscriber application should ensure idempotent processing of order events.

## Core Features


- **Robust Error Handling**: Includes `try...catch` blocks for publish operations, global handlers for `uncaughtException` and `unhandledRejection` to prevent crashes, and a graceful shutdown mechanism to ensure all buffered messages are sent before the application exits.

- **Structured Logging**: Uses the `winston` library to produce structured JSON logs. This format is ideal for consumption by cloud-native logging and monitoring systems like Google Cloud's operations suite (formerly Stackdriver).

- **12-Factor App Principles**:
  - **Config:** Configuration is strictly separated from code and managed through environment variables, supplied by Kubernetes ConfigMaps.
  - **Dependencies:** Explicitly declared and isolated via `package.json`.
  - **Logs:** Treats logs as event streams, writing structured output to `stdout`.
  - **Disposability:** The application can be started or stopped gracefully, with a `SIGTERM` handler to flush messages before exiting.

## Build and Deployment

This application is designed to be deployed on GKE using Google Cloud Build for CI/CD.

### 1. Code Hierarchy and Structure

├── .dockerignore
├── .env.example
├── .gitignore
├── cloudbuild.yaml
├── Dockerfile
├── k8s
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── hpa.yaml
│   └── service-account.yaml
├── package.json
└── src
    ├── config
    │   └── index.js
    ├── controllers
    │   └── orderController.js
    ├── models
    │   ├── customer.js
    │   ├── index.js
    │   ├── order.js
    │   ├── orderItem.js
    │   └── shippingAddress.js
    ├── services
    │   ├── database.js
    │   ├── logger.js
    │   └── pubsub.js
    └── index.js

### 2. Docker Image

The `Dockerfile` uses a multi-stage build to create a lightweight and secure production image. It installs dependencies, creates a non-root user, and copies only the necessary application files.

### 3. GKE Deployment Manifests (`/k8s`)

-   **`service-account.yaml`**: Defines a Kubernetes Service Account (KSA). It is annotated to use GKE Workload Identity, which is the recommended secure way to grant pods access to GCP services without managing service account keys. **You must update this file** with your Google Service Account (GSA) details.
-   **`configmap.yaml`**: Externalizes configuration like the Pub/Sub Subscription.
-   **`deployment.yaml`**: Defines the application deployment, including resource requests/limits, and references the ConfigMap and Service Account.
-   **`hpa.yaml`**: Horizontal Pod Autoscaler (HPA) that scales based on message backlog in the Pub/Sub Subscription.

### 4. Cloud Build CI/CD Pipeline (`cloudbuild.yaml`)

The `cloudbuild.yaml` file defines a pipeline that:
1.  Builds the Docker image.
2.  Pushes the image to Google Artifact Registry.
3.  Updates the `deployment.yaml` with the new image tag and project ID.
4.  Applies the Kubernetes manifests to deploy the application to your GKE cluster.

To use this pipeline, you will need to create a Cloud Build trigger and provide substitution variables for your GKE cluster and Artifact Registry repository.

---