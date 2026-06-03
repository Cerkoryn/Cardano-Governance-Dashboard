<div class="footer-bar">
    <div class="attributions">
        <span>
            dRep and Stake Pool Data sourced from 
            <a href="https://koios.rest/" target="_blank">Koios</a>.
        </span>
        <span>
            Pool Group Data sourced from 
            <a href="https://www.balanceanalytics.io/" target="_blank">Balance Analytics</a>.
        </span>
    </div>
    <div class="social-icons">
        <a href="https://github.com/Cerkoryn/Cardano-Governance-Dashboard" target="_blank" class="margin-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.6 18 4.9 18 4.9c.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
        </a>
        <a href="https://x.com/cerkoryn" target="_blank" class="margin-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
    </div>
</div>

<style>
    .footer-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: var(--maxw);
        margin: 0 auto;
        padding: 24px;
        border-top: 1px solid var(--border);
        background: var(--surface);
        color: var(--text-muted);
    }

    .attributions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        color: var(--text-muted);
    }

    .attributions a {
        color: var(--accent);
        text-decoration: none;
    }

    .attributions a:hover {
        text-decoration: underline;
    }

    .social-icons {
        display: flex;
        align-items: center;
    }

    .margin-icon {
        color: var(--text-muted);
        text-decoration: none;
        margin-left: 1rem;
        line-height: 0;
    }

    .margin-icon:first-child {
        margin-left: 0;
    }

    .margin-icon:hover {
        color: var(--text);
    }
</style>

