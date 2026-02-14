// ===== Supabase 設定 =====
// ※本番では環境変数や別ファイルで管理することを推奨します
const SUPABASE_URL = 'https://xbouikcwdedorsntlsly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rUzWMGicvo_GdUo7-Ydk9Q_YNmGhyZfA-M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 状態管理 =====
let authMode = 'signin'; // 'signin' | 'signup'

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    checkUser();
    loadTimeline();
    setupCharCount();
});

// ===== 画面切り替え =====
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-btn'));
    document.getElementById('page-' + pageName).classList.add('active');
    const navBtn = document.getElementById('nav-' + pageName);
    if (navBtn) navBtn.classList.add('active-btn');
    document.getElementById('header-title').innerText = pageName === 'home' ? 'タイムライン' : 'プロフィール';

    if (pageName === 'home') {
        loadTimeline();
    } else if (pageName === 'profile') {
        loadProfile();
    }
}

// ===== 認証 =====
function signUp() {
    authMode = 'signup';
    document.getElementById('auth-modal-title').textContent = '新規登録';
    document.getElementById('auth-modal-submit').textContent = '登録する';
    document.getElementById('modal-email').value = '';
    document.getElementById('modal-password').value = '';
    document.getElementById('auth-modal').style.display = 'flex';
}

function signIn() {
    authMode = 'signin';
    document.getElementById('auth-modal-title').textContent = 'ログイン';
    document.getElementById('auth-modal-submit').textContent = 'ログイン';
    document.getElementById('modal-email').value = '';
    document.getElementById('modal-password').value = '';
    document.getElementById('auth-modal').style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

async function submitAuthModal() {
    const email = document.getElementById('modal-email').value.trim();
    const password = document.getElementById('modal-password').value;

    if (!email) {
        alert('メールアドレスを入力してください');
        return;
    }
    if (!password || password.length < 6) {
        alert('パスワードは6文字以上で入力してください');
        return;
    }

    const btn = document.getElementById('auth-modal-submit');
    btn.disabled = true;

    try {
        if (authMode === 'signup') {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            alert('登録が完了しました！メールの確認リンクをクリックするか、ログインしてください。');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            alert('ログインしました！');
        }
        closeAuthModal();
        checkUser();
        loadTimeline();
    } catch (err) {
        alert('エラー: ' + (err.message || '不明なエラー'));
    } finally {
        btn.disabled = false;
    }
}

async function signOut() {
    await supabase.auth.signOut();
    alert('ログアウトしました');
    checkUser();
    loadTimeline();
}

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    const statusText = document.getElementById('user-status');
    const postFormContainer = document.getElementById('post-form-container');

    if (user) {
        statusText.textContent = 'ログイン中: ' + user.email;
        if (postFormContainer) postFormContainer.style.display = 'block';
    } else {
        statusText.textContent = 'ログインしていません';
        if (postFormContainer) postFormContainer.style.display = 'none';
    }
}

// ===== プロフィール =====
async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username, bio')
        .eq('id', user.id)
        .single();

    if (profile) {
        document.getElementById('name-input').value = profile.display_name || '';
        document.getElementById('id-input').value = profile.username || '';
        document.getElementById('bio-input').value = profile.bio || '';
    }
}

async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('ログインが必要です');
        return;
    }

    const displayName = document.getElementById('name-input').value.trim();
    const username = document.getElementById('id-input').value.trim();
    const bio = document.getElementById('bio-input').value.trim();

    const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName || null,
        username: username || null,
        bio: bio || null,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
        alert('保存エラー: ' + error.message);
        return;
    }
    alert('プロフィールを保存しました！');
}

// ===== 投稿 =====
function setupCharCount() {
    const input = document.getElementById('post-content-input');
    const count = document.getElementById('char-count');
    if (!input || !count) return;

    input.addEventListener('input', () => {
        count.textContent = input.value.length;
    });
}

async function createPost() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('ログインが必要です');
        return;
    }

    const content = document.getElementById('post-content-input').value.trim();
    if (!content) {
        alert('投稿内容を入力してください');
        return;
    }

    const btn = document.getElementById('submit-post-btn');
    btn.disabled = true;

    try {
        const { error } = await supabase.from('posts').insert({
            user_id: user.id,
            content: content,
            created_at: new Date().toISOString()
        });

        if (error) throw error;

        document.getElementById('post-content-input').value = '';
        document.getElementById('char-count').textContent = '0';
        loadTimeline();
    } catch (err) {
        alert('投稿エラー: ' + (err.message || '不明なエラー'));
    } finally {
        btn.disabled = false;
    }
}

async function loadTimeline() {
    const spinner = document.getElementById('loading-spinner');
    const emptyEl = document.getElementById('timeline-empty');
    const postsEl = document.getElementById('timeline-posts');

    if (!postsEl) return;

    spinner.style.display = 'block';
    emptyEl.style.display = 'block';
    postsEl.innerHTML = '';

    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('id, content, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!posts || posts.length === 0) {
            spinner.style.display = 'none';
            return;
        }

        emptyEl.style.display = 'none';

        // ユーザーID一覧でプロフィールを一括取得
        const userIds = [...new Set(posts.map(p => p.user_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, username')
            .in('id', userIds);

        const profileMap = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });

        for (const post of posts) {
            const profile = profileMap[post.user_id];
            const displayName = profile?.display_name || '名無し';
            const username = profile?.username ? '@' + profile.username : '';
            const initial = displayName.charAt(0).toUpperCase();
            const timeStr = formatTime(post.created_at);

            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <div class="post-header">
                    <div class="post-avatar">${initial}</div>
                    <div class="post-meta">
                        <span class="post-author">${escapeHtml(displayName)}</span>
                        ${username ? `<span class="post-username">${escapeHtml(username)}</span>` : ''}
                        <span class="post-time">${timeStr}</span>
                    </div>
                </div>
                <div class="post-content">${escapeHtml(post.content)}</div>
            `;
            postsEl.appendChild(card);
        }
    } catch (err) {
        console.error(err);
        emptyEl.style.display = 'none';
        postsEl.innerHTML = '<div class="post-card"><p style="color:#dc3545">投稿の読み込みに失敗しました。Supabaseのpostsテーブルを作成してください。</p></div>';
    } finally {
        spinner.style.display = 'none';
    }
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '時間前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '日前';

    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
