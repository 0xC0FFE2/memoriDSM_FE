// security.js

export async function handleSecurityCheck() {
    const accessToken = getCookie('ACCESS');
    const refreshToken = getLocalStorageItem('REFRESH');

    if (accessToken) {
        const isExpired = await isTokenExpired(accessToken);
        if (isExpired) {
            if (refreshToken) {
                const newAccessToken = await refreshAccessToken(refreshToken);
                if (newAccessToken) {
                    location.reload();
                    return true; // 인증 성공
                } else {
                    redirectToLogin();
                }
            } else {
                redirectToLogin();
            }
        } else {
            return true; // 토큰이 유효한 경우
        }
    } else {
        redirectToLogin();
    }
    return false; // 인증 실패
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function getLocalStorageItem(name) {
    return localStorage.getItem(name);
}

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function redirectToLogin() {
    window.location.href = './';
}

async function isTokenExpired(token) {
    try {
        const response = await fetch('https://auth.nanu.cc/api/mypage', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.status !== 200; // 응답이 200이 아니면 토큰 만료
    } catch (error) {
        console.error('Error validating token:', error);
        return true; // 요청 실패 시 만료로 판단
    }
}

async function refreshAccessToken(refreshToken) {
    try {
        const response = await fetch('https://auth.nanu.cc/api/oauth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (response.status === 200) {
            const data = await response.json();
            setCookie('ACCESS', data.access_token, 1);
            return data.access_token;
        } else {
            return null; // 리프레시 토큰도 만료됨
        }
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
}
