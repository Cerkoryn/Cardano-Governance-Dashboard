<script lang="ts">
    import TooltipIcon from '$lib/components/TooltipIcon.svelte';
    import { includeInactiveDReps } from '$lib/stores/stores';

    export let darkMode: boolean;
    export let toggleTheme: () => void;
</script>

<div class="header-bar">
    <div class="left-controls">
        <label class="toggle-label">
            <input 
                type="checkbox" 
                bind:checked={$includeInactiveDReps} 
            />
            Include Inactive dReps 
        </label>
        <div class="info-tooltip">
            <em> What do these charts mean?</em> <TooltipIcon message="These charts show the Minimum Attack Vector (similarly known as the Nakamoto Coefficient) for each proposal and each governing body on Cardano.<br/><br/>Each chart indicates the smallest number of entities needed to collectively meet or exceed the required threshold for a given governance action." />
        </div>
    </div>
    <div class="title-wrapper">
        <h1 class="title-text">Cardano Governance Dashboard</h1>
    </div>
    <div class="right-controls">
        <button on:click={toggleTheme}>
            <i class={darkMode ? 'fas fa-sun margin-icon' : 'fas fa-moon margin-icon'}></i>
        </button>
    </div>
</div>

<style>
    :root {
        --header-height: 60px;
    }

    .header-bar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1000; 
        display: flex;
        align-items: center;
        justify-content: center; 
        padding: 1rem 2rem;
        box-sizing: border-box;
        background-color: var(--footer-bg-color);
        border-radius: 0;
        margin-bottom: 2rem;
    }

    .left-controls,
    .right-controls {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
    }

    .left-controls {
        left: 2rem;
    }

    .right-controls {
        right: 2rem;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        font-size: 1rem;
        color: var(--title-text-color);
    }

    .toggle-label input {
        margin-right: 0.5rem;
    }

    .info-tooltip {
        display: flex;
        align-items: center;
        font-size: 0.9rem;
        color: var(--title-text-color);
        margin-left: 1rem;
    }

    .title-wrapper {
        text-align: center;
    }

    .title-text {
        margin: 0;
        font-size: 2rem; 
        color: var(--title-text-color);
    }

    .margin-icon {
        font-size: 2rem; 
        color: var(--title-text-color);
        text-decoration: none;
        margin-left: 1rem;
    }

    .margin-icon:hover {
        color: var(--footer-icon-hover-color); 
    }

    button {
        font-size: 1rem;
        padding: 0rem 0rem;
        background-color: var(--button-bg-color);
        color: var(--title-text-color);
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
    }

    button:hover {
        background-color: var(--button-hover-bg-color);
    }

    @media (max-width: 1280px) {
        :root {
            --header-height: 50px; 
        }

        .header-bar {
            flex-direction: column;
            align-items: center;
            padding: 0.5rem;
        }

        .left-controls,
        .right-controls {
            position: static;
            transform: none;
            margin-bottom: 0rem; 
            width: 100%;
            display: flex;
            justify-content: center; 
            align-items: center;
        }

        .left-controls {
            gap: 1rem; 
            margin-bottom: 0.5rem;
        }

        .toggle-label {
            display: flex;
            align-items: center;
            font-size: 0.9rem; 
            color: var(--title-text-color);
        }

        .toggle-label input {
            margin-right: 0.25rem; 
            transform: scale(0.9); 
        }

        .info-tooltip {
            display: flex;
            align-items: center;
            font-size: 0.6rem; 
            color: var(--title-text-color);
            margin-left: 0; 
            margin-top: 0.3rem; 
        }

        .title-wrapper {
            order: 1;
            width: 100%;
            text-align: center;
            margin-bottom: 0.5rem; 
        }

        .title-text {
            margin: 0;
            font-size: 1rem; 
            color: var(--title-text-color);
        }

        .margin-icon {
            font-size: 1.25rem;
            color: var(--title-text-color);
            margin-left: 0; 
            margin-bottom: 0rem;
        }

        button {
            font-size: 0.9rem; 
            padding: 0.3rem 0.6rem; 
            background-color: var(--button-bg-color);
            color: var(--title-text-color);
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
        }

        button:hover {
            background-color: var(--button-hover-bg-color);
        }

        .left-controls {
            order: 2;
        }

        .right-controls {
            order: 3;
            justify-content: center;
        }
    }
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">