import { pathSDK } from '../src/index';

let isAuthenticated = false;

// Create SDK instance
const path = pathSDK({
    baseUrl: 'http://localhost:3000',
    courseId: parseInt((document.getElementById('progressCourseId') as HTMLInputElement).value),
    callbackUrl: 'http://localhost:5500'
});

async function checkAuth() {
    const authStatusDiv = document.getElementById('authStatus')!;
    const authButtonsDiv = document.getElementById('authButtons')!;

    const authStatus = await path.checkAuth();

    if (authStatus.isAuthenticated && authStatus.enrollment) {
        isAuthenticated = true;
        authStatusDiv.className = 'success';
        authStatusDiv.innerHTML = `
<strong>✓ Logged in</strong><br>
- User ID: ${authStatus.enrollment.user.id}<br>
- Email: ${authStatus.enrollment.user.email || 'N/A'}<br>
- Enrolled in Course: ${authStatus.enrollment.course.title}<br>
        `.trim();

        authButtonsDiv.innerHTML = '<button onclick="logout()">Logout</button>';
    } else {
        isAuthenticated = false;
        authStatusDiv.className = 'error';
        authStatusDiv.textContent = '✗ Not logged in';
        authButtonsDiv.innerHTML = '<button onclick="login()">Login</button>';
    }
}

function login() {
    path.login();
}

async function logout() {
    try {
        await path.logout();
        await checkAuth();
        document.getElementById('progressDisplay')!.innerHTML = '';
        alert('Logged out successfully');
    } catch (error: any) {
        console.error('Logout error:', error);
        alert('Failed to logout: ' + error.message);
    }
}

async function loadUserProgress() {
    const btn = document.getElementById('loadProgressBtn') as HTMLButtonElement;
    const resultDiv = document.getElementById('progressDisplay')!;
    const courseId = (document.getElementById('progressCourseId') as HTMLInputElement).value;

    if (!courseId) {
        resultDiv.className = 'error';
        resultDiv.textContent = 'Please enter a course ID';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Loading...';
    resultDiv.textContent = 'Loading user progress...';
    resultDiv.className = '';

    try {
        const info = await path.getEnrollmentAndProgress();

        // Display enrollment and progress
        resultDiv.className = 'success';
        resultDiv.innerHTML = `
<strong>✓ Enrollment & Progress Loaded</strong>

<strong>Full Response:</strong>
<pre>${JSON.stringify(info, null, 2)}</pre>
        `.trim();

        console.log('Enrollment & progress:', info);

    } catch (error: any) {
        resultDiv.className = 'error';
        resultDiv.innerHTML = `
<strong>✗ Error:</strong> ${error.message}

This could mean:
- You're not signed in
- You're not enrolled in course ${courseId}
- The course doesn't exist
        `.trim();
        console.error('Failed to load progress:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Load Progress';
    }
}

async function submitProgress() {
    const btn = document.getElementById('submitProgressBtn') as HTMLButtonElement;
    const resultDiv = document.getElementById('progressResult')!;
    const courseId = (document.getElementById('progressCourseId') as HTMLInputElement).value;
    const milestoneId = (document.getElementById('milestoneId') as HTMLInputElement).value;
    const valueInput = (document.getElementById('progressValue') as HTMLInputElement).value;

    // Validate inputs
    if (!courseId) {
        resultDiv.className = 'error';
        resultDiv.textContent = 'Please enter a course ID';
        return;
    }

    if (!milestoneId) {
        resultDiv.className = 'error';
        resultDiv.textContent = 'Please enter a milestone ID';
        return;
    }

    if (valueInput === '') {
        resultDiv.className = 'error';
        resultDiv.textContent = 'Please enter a value';
        return;
    }

    // Parse value - try JSON first, fallback to string
    let parsedValue: any;
    try {
        parsedValue = JSON.parse(valueInput);
    } catch {
        parsedValue = valueInput;
    }

    // Disable button and show loading state
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    resultDiv.textContent = 'Submitting progress...';
    resultDiv.className = '';

    try {
        const result = await path.submitProgress(parseInt(milestoneId), parsedValue);

        // Display the results
        resultDiv.className = 'success';
        resultDiv.innerHTML = `
<strong>✓ Progress submitted successfully!</strong>

<strong>Progress Details:</strong>
- Progress ID: ${result.progress.id}
- User ID: ${result.progress.userId}
- Milestone ID: ${result.progress.courseMilestoneId}
- Value: ${result.progress.value}
- Created: ${new Date(result.progress.createdAt).toLocaleString()}

<strong>Full Response:</strong>
<pre>${JSON.stringify(result, null, 2)}</pre>
`.trim();

        console.log('Progress submitted:', result);

        // Reload progress after successful submission
        await loadUserProgress();

    } catch (error: any) {
        resultDiv.className = 'error';
        resultDiv.innerHTML = `
<strong>✗ Error:</strong> ${error.message}

This could mean:
- You're not signed in
- You're not enrolled in course ${courseId}
- The milestone ID ${milestoneId} doesn't exist
- The milestone doesn't belong to this course
- The value type doesn't match the milestone's expected type
- CORS origin mismatch
`.trim();
        console.error('Failed to submit progress:', error);
    } finally {
        // Re-enable button
        btn.disabled = false;
        btn.textContent = 'Submit Progress';
    }
}

// Expose functions globally for onclick handlers
(window as any).checkAuth = checkAuth;
(window as any).login = login;
(window as any).logout = logout;
(window as any).loadUserProgress = loadUserProgress;
(window as any).submitProgress = submitProgress;

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    if (isAuthenticated) {
        await loadUserProgress();
    }
});
