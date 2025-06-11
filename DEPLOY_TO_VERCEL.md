# Deploying BlueMoon Apartment Management to Vercel

This guide will help you deploy the BlueMoon Apartment Management application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A MongoDB database (MongoDB Atlas recommended)
3. Git repository with your project

## Steps

### 1. Prepare your MongoDB Database

1. Create a MongoDB Atlas cluster or use your preferred MongoDB hosting solution
2. Create a database named `bluemoon_apartment`
3. Add a database user with read/write permissions
4. Get your MongoDB connection string
5. **IMPORTANT:** Make sure to add "0.0.0.0/0" to your IP access list in MongoDB Atlas settings to allow connections from Vercel

### 2. Deploy to Vercel

#### Using Vercel Dashboard

1. Login to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Configure project settings:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `frontend/build`
   - Root Directory: (leave default)
5. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/bluemoon_apartment?retryWrites=true&w=majority`)
   - `JWT_SECRET`: A secret string for JWT token encryption (e.g., `your-secret-key-here`)
   - `NODE_ENV`: Set to `production`
6. Click "Deploy"

#### Using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. In your project root directory, run: `vercel`
4. Follow the prompts to configure your project
5. Add environment variables:
   ```
   vercel env add MONGO_URI
   vercel env add JWT_SECRET
   vercel env add NODE_ENV
   ```
6. Deploy to production: `vercel --prod`

### 3. Test Your Deployment

1. Once deployed, Vercel will provide you with a URL (e.g., `https://your-project.vercel.app`)
2. Visit the URL and test the application
3. Verify that you can:
   - Login
   - Access all features
   - Perform CRUD operations

### 4. Custom Domain (Optional)

1. In Vercel dashboard, go to your project settings
2. Navigate to "Domains"
3. Add your custom domain and follow instructions for DNS setup

## Troubleshooting

### 404 Errors

If you're getting 404 errors after deployment:

1. **Check Vercel Logs**:
   - Go to your project in the Vercel dashboard
   - Click on "Deployments" and select your latest deployment
   - Click "Functions" to check for backend errors
   - Click "Build" to check for frontend build errors

2. **Verify Environment Variables**:
   - Make sure all required environment variables are set correctly
   - Check that MONGO_URI is correct and accessible

3. **Redeploy with Clean Cache**:
   - Try running `vercel --prod --force` to redeploy with a clean cache

4. **Check API Access**:
   - Try accessing `/api` endpoint directly to see if backend is working
   - Example: `https://your-project.vercel.app/api`

5. **Check MongoDB Connection**:
   - Ensure your MongoDB Atlas IP access list includes "0.0.0.0/0"
   - Test your MongoDB connection string locally before deploying

6. **Common Issues**:
   - Missing `/` in API routes in frontend code
   - Incorrect paths in `vercel.json` file
   - Missing or incomplete build process

- If you encounter connection issues with MongoDB, verify your network allowlist settings in MongoDB Atlas
- For API errors, check Vercel logs for detailed error messages
- If the frontend is loading but API calls fail, verify that environment variables are correctly set

## Notes

- Vercel automatically handles HTTPS certificates
- The application is serverless, so some long-running operations might need optimization
- Vercel has usage limits on the free tier, check their documentation for details
- For full-stack applications, Vercel converts your Express API to serverless functions
- MongoDB connections might have higher latency in serverless environments 