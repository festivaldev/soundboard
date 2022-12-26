<template>
	<div class="d-flex flex-column" style="height: 100vh" data-client>
		<template v-if="sections && outputDevices">
			<div class="position-fixed p-3 w-100 bg-white" style="z-index: 20">
				<div class="w-100 border rounded px-2 py-2 d-flex justify-content-between">
					<div class="btn-group">
						<button type="button" class="btn btn-light" data-bs-toggle="dropdown" aria-expanded="false">
							<i class="bi bi-volume-up-fill" />
						</button>
						<ul class="dropdown-menu">
							<li><h6 class="dropdown-header">Volume</h6></li>
							<li class="dropdown-item-text d-flex">
								<input type="range" class="form-range" min="0" max="1" step="0.0625" v-model="volume" style="width: 200px">
							</li>
						</ul>

						<button type="button" class="btn btn-light dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false" />
						<ul class="dropdown-menu">
							<li><h6 class="dropdown-header">Remote Output Device</h6></li>
							<li v-for="(dev, i) in outputDevices" :key="i">
								<a class="dropdown-item d-flex" href="#" @click.prevent="(e) => { sinkId = dev.deviceId }">
									<label class="flex-fill">{{ dev.label }}</label>
									<i class="bi bi-check-lg ms-2 text-primary" v-show="dev.deviceId === sinkId" />
								</a>
							</li>
						</ul>
					</div>

					<div class="flex-fill d-flex justify-content-center">
						<div class="input-group mx-2" style="max-width: 600px">
							<span class="input-group-text bg-light px-2 border-0">
								<i class="bi bi-search" />
							</span>
							<input type="text" class="form-control bg-light border-0" placeholder="Type to search..." v-model="filterText" />
						</div>
					</div>

					<!-- <button type="button" class="btn btn-light me-2" data-bs-toggle="dropdown" :disabled="filterText?.length > 0">
						<i class="bi bi-plus-lg" />
					</button>
					<ul class="dropdown-menu">
						<li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#newSectionDialog">Add Section</a></li>
						<li><a class="dropdown-item" href="#" @click.prevent="selectAudioClip">Add Clip</a></li>
					</ul>

					<div class="btn-group" role="group">
						<button
							type="button"
							class="btn"
							:class="{
								'btn-light': !isInEditMode,
								'btn-primary': isInEditMode
							}"
							:disabled="filterText?.length > 0"
							@click.prevent="isInEditMode = !isInEditMode"
						>
							<i class="bi bi-pencil" />
						</button>

						<button type="button" class="btn btn-light dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false" :disabled="filterText?.length > 0" />
						<ul class="dropdown-menu">
							<li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#sectionOrderDialog">Edit Section Order</a></li>
						</ul>
					</div> -->
				</div>
			</div>

			<template v-if="sections.length">
				<VirtualScroll
					class="flex-fill container-fluid px-0 pb-3" style="margin-top: 88px"
					v-model="filteredSections"
					:headerHeight="78"
					:itemHeight="gridItemSize"
					:itemPadding="gridItemPadding"
					:itemsPerRow="gridItemsPerRow"
					:isInEditMode="isInEditMode"
					ref="scroller"
				>
					<template slot="header" slot-scope="{section}">
						<div class="section-title d-flex align-items-center w-100 h-100">
							<div
								class="flex-fill d-flex"
								data-bs-toggle="collapse"
								data-bs-target="#collection-favorites"
								aria-expanded="true"
								aria-controls="collection-favorites"
								role="button"
							>
								<span class="fs-1 fw-bold text-truncate">{{ section.title }}</span>
								<span class="fs-1 fw-light text-muted ms-2">({{ section.clips.length }})</span>
							</div>
						</div>
					</template>

					<template slot="item" slot-scope="{section, item}">
						<ClipItem
							:clip="item"
							:ref="`${item.id}`"
							:isFavorite="favorites.includes(item.id)"
							:isInFavoriteSection="section.id === 'favorites'"
							:playbackState="playbackQueue[item.id]?.playbackState || 0"

							@play="sendPlayClip"
							@pause="sendPauseClip"
							@stop="sendStopClip"

							@favorited="clipFavorited"
							@deleted="clipDeleted"
							@updated="clipUpdated"
						/>
					</template>
				</VirtualScroll>
			</template>

			<template v-else>
				<div class="d-flex flex-column flex-fill justify-content-center">
					<span class="text-center text-muted">Nothing here but sheer emptiness.</span>
				</div>
			</template>
		</template>

		<template v-else>
			<div class="loading-container">
				<div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status" />
			</div>
		</template>
	</div>
</template>

<style lang="less">
.clip-container .clip-indicator-area {
	display: none !important;
}
</style>

<script>
import { v4 as uuid } from 'uuid'
import draggable from 'vuedraggable'

import VirtualScroll from '@/components/VirtualScroll.vue'
import ClipItem from '@/components/ClipItem.vue'
import MediaPlayer from '@/components/MediaPlayer.vue'

import PLAYBACK_MODE from '@/scripts/PlaybackMode'
import { SocketService } from '../scripts/SocketService'

export default {
	components: {
		VirtualScroll,
		ClipItem,
		MediaPlayer,
		draggable
	},
	data() {
		return {
			outputDevices: null,
			sinkId: "default",
			volume: 1.0,

			filterText: "",

			isInEditMode: false,

			newSectionData: {
				id: null,
				title: "",
				clips: [],
				collapsed: false
			},

			renameSectionDialog: null,
			renameSectionData: {
				id: null,
				title: null,
				clips: []
			},

			newClipDialog: null,
			newClipData: {
				id: null,
				name: null,
				artist: null,
				section: null,
				file: null,
				playbackMode: PLAYBACK_MODE.Trigger
			},

			favorites: null,
			sections: null,

			playbackQueue: {},

			ignoreWatcher: false
		}
	},
	async mounted() {
		// await SocketService.connect(`ws://${location.host}/client`);
		await SocketService.connect(`ws://${location.hostname}:8081/client`);

		SocketService.$on("message", (data) => {
			switch (data.type) {
				case "outputDevices":
					this.outputDevices = data.outputDevices;
					break;
				case "sinkId":
					this.ignoreWatcher = true;
					this.sinkId = data.sinkId;
					break;
				case "volume":
					this.ignoreWatcher = true;
					this.volume = data.volume;

					break;

				case "favorites":
					this.favorites = data.favorites;
					break;
				case "sections":
					this.sections = data.sections;
					break;

				case "playbackQueue":
					this.playbackQueue = data.playbackQueue;
					break;
			}

			this.$nextTick(() => {
				this.ignoreWatcher = false;
			});
		});

		return;

		this.newClipDialog = new bootstrap.Modal(this.$el.querySelector('#newClipDialog'));
		this.renameSectionDialog = new bootstrap.Modal(this.$el.querySelector('#renameSectionDialog'));
	},
	methods: {
		gridItemsPerRow() {
			if (window.innerWidth >= 992) {
				return 6;
			} else if (window.innerWidth >= 768) {
				return 4;
			} else if (window.innerWidth >= 576) {
				return 3;
			} else {
				return 2;
			}
		},
		gridItemSize() {
			let itemsPerRow = this.gridItemsPerRow();

			return (window.innerWidth - ((itemsPerRow + 1) * this.gridItemPadding())) / itemsPerRow;
		},
		gridItemPadding() {
			if (window.innerWidth >= 576) {
				return 24;
			} else {
				return 16;
			}
		},

		clipUpdated(clipId, clipData) {
			let section = this.sections.find(_ => _.clips.find(_ => _.id === clipId) !== undefined)

			if (section) {
				section.clips[section.clips.findIndex(_ => _.id === clipId)] = clipData;

				this.sections = [...this.sections];
			}

		},
		clipDeleted(clipId) {
			this.stopClip(clipId);

			let section = this.sections.find(_ => _.clips.find(_ => _.id === clipId) != null);
			if (section) {
				section.clips.splice(section.clips.findIndex(_ => _.id === clipId), 1);

				this.sections = [...this.sections];

				if (this.favorites.includes(clipId)) {
					this.favorites.splice(this.favorites.indexOf(clipId), 1);
				}
			}
		},
		clipFavorited(clipId) {
			if (this.favorites.includes(clipId)) {
				this.favorites.splice(this.favorites.indexOf(clipId), 1)
			} else {
				this.favorites.push(clipId);
			}

			this.$storage.set("favorites", this.favorites);
		},

		sendPlayClip(clipId, startFrom) {
			SocketService.send({
				type: "playClip",
				clipId,
				file: this.clips.find(_ => _.id === clipId).file,
				startFrom: !isNaN(startFrom) ? startFrom : undefined,
				local: this.useLocalAudio
			});
		},
		sendPauseClip(clipId) {
			if (this.useLocalAudio) this.pauseClip(clipId);

			SocketService.send({
				type: "pauseClip",
				clipId
			});
		},
		sendStopClip(clipId) {
			if (this.useLocalAudio) this.stopClip(clipId);

			SocketService.send({
				type: "stopClip",
				clipId
			});
		}
	},
	computed: {
		clips: {
			get() {
				return [].concat.apply([], this.sections.map(_ => _.clips));
			}
		},
		favoriteClips: {
			get() {
				return this.clips.filter(_ => this.favorites.includes(_.id)).sort((a, b) => {
					return this.favorites.indexOf(a.id) - this.favorites.indexOf(b.id);
				});
			}
		},
		filteredSections: {
			get() {
				let sections = this.sections;

				if (this.favorites.length) {
					sections = [
						{
							id: "favorites",
							title: "Favorites",
							clips: this.favoriteClips
						},
						...this.sections
					];
				}

				if (this.filterText.length) {
					return sections.reduce((sectionList, sectionObj) => {
						let filteredClips = sectionObj.clips.filter(_ => {
							return _.name?.toLowerCase().indexOf(this.filterText.toLowerCase()) >= 0 || _.artist?.toLowerCase().indexOf(this.filterText.toLowerCase()) >= 0
						});

						if (filteredClips.length) {
							sectionList.push({
								...sectionObj,
								clips: filteredClips
							});
						}

						return sectionList;
					}, []);
				}

				return sections;
			},
			set(value) {
				if (this.filterText.length) return;

				let favorites = value.find(_ => _.id === "favorites");

				if (favorites) {
					this.favorites = favorites.clips.map(_ => _.id)
				}

				let sections = value.filter(_ => _.id !== "favorites");
				this.sections = sections;
			}
		},
	},
	watch: {
		sinkId(value) {
			if (!this.ignoreWatcher) {
				SocketService.send({ type: "sinkId", sinkId: this.sinkId });
			}
		},
		volume(value) {
			if (!this.ignoreWatcher) {
				SocketService.send({ type: "volume", volume: this.volume });
			}
		},
	}
}
</script>