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
            <i class="fab fa-github"></i>
        </a>
        <a href="https://twitter.com/cerkoryn" target="_blank" class="margin-icon">
            <i class="fab fa-x-twitter"></i>
        </a>
    </div>
</div>

<style>
    .footer-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        max-width: 100%; 
        padding: 1rem 2rem; 
        box-sizing: border-box;
        background-color: var(--footer-bg-color);
        border-radius: 0;
        margin-bottom: 0rem;
    }

    .attributions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        color: var(--title-text-color);
    }

    .attributions a {
        color: #d0e1ff;
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
        font-size: 2rem;
        color: var(--title-text-color);
        text-decoration: none;
        margin-left: 1rem;
    }

    .margin-icon:first-child {
        margin-left: 0;
    }

    .margin-icon:hover {
        color: var(--footer-icon-hover-color);
    }
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">