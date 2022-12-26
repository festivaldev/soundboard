<template>
	<router-view />
</template>

<style lang="less">
::-webkit-scrollbar {
	display: none;
}

@keyframes icon-wiggle {
	0%, 100% {
		transform: rotate(0deg) translate(0px, 0px);
	}

	25% {
		transform: rotate(1deg) translate(0px, 1px);
	}

	75% {
		transform: rotate(-1deg) translate(0px, -1px);
	}
}

@media (prefers-color-scheme: dark) {
	:root {
		--bs-white: #1b1b1b !important;
		--bs-white-rgb: 27,27,27 !important;

		--bs-black: #fff !important;
		--bs-black-rgb: 255,255,255 !important;

		--bs-body-color: #f8f9fa !important;
		--bs-light: #212529 !important;
		--bs-light-rgb: 33,37,41 !important;

		--bs-border-color: #54545899 !important;
		--bs-border-color-translucent: #54545899 !important;
	}

	.input-group-text {
		color: #fff !important;
		border: 1px solid #212529 !important;
	}

	input.form-control {
		&:not(:focus) {
			color: #fff;
			background-color: #373b3e;
			border-color: var(--bs-border-color);
		}

		&:focus {
			background-color: #fff !important;
		}
	}


	select.form-select {
		color: #fff;
		background-color: #212529;
		border-color: var(--bs-border-color);
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23ebebef99' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");

		&:focus {
			border-color: var(--bs-border-color);
		}
	}

	.text-muted {
		color: #ebebef99 !important
	}

	.text-white {
		--bs-white: #fff !important;
		--bs-white-rgb: 255,255,255 !important;
	}

	.btn-light {
		--bs-btn-color: #fff !important;
		--bs-btn-bg: #212529 !important;
		--bs-btn-border-color: #212529 !important;
		--bs-btn-hover-color: #fff !important;
		--bs-btn-hover-bg: #424649 !important;
		--bs-btn-hover-border-color: #373b3e !important;
		--bs-btn-focus-shadow-rgb: 66,70,73 !important;
		--bs-btn-active-color: #fff !important;
		--bs-btn-active-bg: #4d5154 !important;
		--bs-btn-active-border-color: #373b3e !important;
		--bs-btn-active-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125) !important;
		--bs-btn-disabled-color: #fff !important;
		--bs-btn-disabled-bg: #212529 !important;
		--bs-btn-disabled-border-color: #212529 !important;
	}

	.modal {
		--bs-modal-bg: #212529 !important;
	}

	.dropdown-menu {
		--bs-dropdown-color: ##fff;
		--bs-dropdown-bg: #212529;
		--bs-dropdown-border-color: var(--bs-border-color);
		--bs-dropdown-divider-bg: var(--bs-border-color-translucent);
		--bs-dropdown-box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
		--bs-dropdown-link-color: #fff;
		--bs-dropdown-link-hover-color: #ffffff;
		--bs-dropdown-link-hover-bg: #424649;
		--bs-dropdown-link-active-color: #fff;
		--bs-dropdown-link-active-bg: #0d6efd;
		--bs-dropdown-link-disabled-color: #adb5bd;
		--bs-dropdown-header-color: #ebebef99;
	}

	.list-group {
		--bs-list-group-color: #ffffff;
		--bs-list-group-bg: #212529;
		--bs-list-group-border-color: var(--bs-border-color);
		--bs-list-group-action-color: #495057;
		--bs-list-group-action-hover-color: #495057;
		--bs-list-group-action-hover-bg: #f8f9fa;
		--bs-list-group-action-active-color: #212529;
		--bs-list-group-action-active-bg: #e9ecef;
		--bs-list-group-disabled-color: #6c757d;
		--bs-list-group-disabled-bg: #fff;
		--bs-list-group-active-color: #fff;
		--bs-list-group-active-bg: #0d6efd;
		--bs-list-group-active-border-color: #0d6efd;
	}
}

.modal.modal-static .modal-dialog {
    transform: scale(1.0) !important;
}

.loading-container {
	position: absolute;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

.square:before{
	content:"";
	display: block;
	padding-top: 100%;
}

.page-link {
	transition: none !important;

	&:focus {
		box-shadow: none !important;
	}
}

.form-control:focus,
.form-select:focus {
	box-shadow: none !important;
}

.clip-section {
	top: 0;
	.section-header {
		position: sticky;
		position: -webkit-sticky;
		height: 78px;
		top: 0;
		z-index: 10;
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;

		.section-title {
			.fs-1.fw-bold {
				font-family: "SF Pro Rounded", var(--bs-font-sans-serif);
			}
		}

		.bi-chevron-right {
			transition: transform .25s ease;
		}

		[data-bs-toggle] {
			min-width: 0;
		}

		[data-bs-toggle]:not([aria-expanded="false"]) + .dropdown + .bi-chevron-right,
		[data-bs-toggle]:not([aria-expanded="false"]) + .bi-chevron-right {
			transform: rotate(90deg);
		}
	}

	&.edit-mode .col-6.col-md-3.col-lg-2:not(.no-anim) {
		&:nth-child(2n) {
            animation: icon-wiggle linear infinite .25s;
        }

		 &:nth-child(2n-1) {
            animation: icon-wiggle linear infinite .25s reverse;
        }

		.clip-container {
			.clip-play-area,
			.clip-indicator-area {
				// visibility: hidden !important;
				pointer-events: none;
			}

			.clip-options-dropdown {
				visibility: hidden !important;
				pointer-events: none;
				cursor: default;
			}
		}
	}
}

@media (max-width: 576px) {
	.toast {
		--bs-toast-max-width: 100% !important;
	}
}
</style>