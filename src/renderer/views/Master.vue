<template>
	<div class="d-flex flex-column" style="height: 100vh" data-master>
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
							<li><h6 class="dropdown-header">Output Device</h6></li>
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

					<button type="button" class="btn btn-light me-2" data-bs-toggle="dropdown" :disabled="filterText?.length > 0">
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
							<li><hr class="dropdown-divider" /></li>
							<li v-if="!remoteControlEnabled"><a class="dropdown-item" href="#" @click.prevent="() => remoteControlEnabled = true">Enable Remote Control</a></li>
							<li v-if="remoteControlEnabled"><a class="dropdown-item" href="#" @click.prevent="() => remoteControlEnabled = false">Disable Remote Control</a></li>
						</ul>
					</div>
				</div>
			</div>

			<MediaPlayer
				v-model="playbackQueue"
				:sinkId="sinkId"
				:volume="volume"
				ref="mediaPlayer"
			/>

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

							<div class="dropdown" style="pointer-events: all" v-if="section.id !== 'favorites'">
								<button class="btn text-muted ms-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
									<i class="bi bi-three-dots" />
								</button>
								<ul class="dropdown-menu">
									<li><h6 class="dropdown-header">Sort Clips</h6></li>
									<li><a class="dropdown-item" href="#" @click.prevent="() => sortSection(section.id, 1)">By Name (A &rarr; Z)</a></li>
									<li><a class="dropdown-item" href="#" @click.prevent="() => sortSection(section.id, 2)">By Name (Z &rarr; A)</a></li>
									<li><a class="dropdown-item" href="#" @click.prevent="() => sortSection(section.id, 3)">By Artist (A &rarr; Z)</a></li>
									<li><a class="dropdown-item" href="#" @click.prevent="() => sortSection(section.id, 4)">By Artist (Z &rarr; A)</a></li>
									<li><hr class="dropdown-divider" /></li>
									<li><a class="dropdown-item" href="#" @click.prevent="() => selectAudioClip(section.id)">Add Clip</a></li>
									<li><a class="dropdown-item" href="#" @click.prevent="() => startRenameSection(section.id)">Rename</a></li>
									<!-- <li><a class="dropdown-item text-danger" href="#" @click.prevent="() => deleteSection(section.id)">Delete</a></li> -->
								</ul>
							</div>

							<button class="btn btn-danger ms-2" v-if="isInEditMode && section.id !== 'favorites'" @click.prevent="() => deleteSection(section.id)">
								<i class="bi bi-trash" />
							</button>
							<!-- <i class="bi bi-chevron-right d-inline-block ms-2 fs-4 text-muted" /> -->
						</div>
					</template>

					<template slot="item" slot-scope="{section, item}">
						<ClipItem
							:clip="item"
							:ref="`${item.id}`"
							:isFavorite="favorites.includes(item.id)"
							:isInFavoriteSection="section.id === 'favorites'"
							:playbackState="playbackQueue[item.id]?.playbackState || 0"

							@play="playClip"
							@pause="pauseClip"
							@stop="stopClip"

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

			<div class="position-fixed bottom-0 end-0 w-100 p-3 pe-none" style="z-index: 1000">
				<div id="socketOpenToast" class="toast bg-white ms-auto pe-auto" role="alert" aria-live="assertive" aria-atomic="true">
    				<div class="toast-header">
						<strong class="me-auto">Remote Control available!</strong>
						<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
					</div>
					<div class="toast-body">
						<p>Open <strong>http://{{ remoteControlHost }}:{{ remoteControlPort }}</strong> on any other device to use Remote Control.</p>
					</div>
				</div>
			</div>
		</template>

		<template v-else>
			<div class="loading-container">
				<div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status" />
			</div>
		</template>

		<div class="modal fade" data-bs-backdrop="static" id="newSectionDialog" tabindex="-1">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<h1 class="modal-title fs-5">Add new section</h1>
					</div>
					<div class="modal-body">
						<div class="mb-3">
							<label class="form-label">Section Name</label>
							<input type="text" class="form-control" placeholder="" v-model="newSectionData.title" />
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-light" data-bs-dismiss="modal" @click.prevent="cancelAddSection">Cancel</button>
						<button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click.prevent="addSection">Add</button>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" data-bs-backdrop="static" id="newClipDialog" tabindex="-1">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Add new clip</h5>
						<!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" /> -->
					</div>
					<div class="modal-body">
						<div class="mb-3">
							<label class="form-label">Name</label>
							<input type="text" class="form-control" placeholder="" v-model="newClipData.name" />
						</div>
						<div class="mb-3">
							<label class="form-label">Artist</label>
							<input type="text" class="form-control" placeholder="" v-model="newClipData.artist" />
						</div>

						<div class="mb-3">
							<label class="form-label">Section</label>
							<select class="form-select" v-model="newClipData.section">
								<option selected disabled>Select a section</option>
								<option v-for="(section) in this.sections" :key="section.id" :value="section.id">{{ section.title }}</option>
							</select>
						</div>

						<div class="mb-3">
							<label class="form-label">Playback Mode</label>
							<select class="form-select" v-model="newClipData.playbackMode">
								<option :value="0" selected>Trigger</option>
								<option :value="1">Hold</option>
								<option :value="2">Play/Pause</option>
								<option :value="3">On/Off</option>
								<option :value="4">Loop</option>
							</select>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-light" data-bs-dismiss="modal" @click="cancelSaveAudioClip">Cancel</button>
						<button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click="saveAudioClip">Save</button>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" data-bs-backdrop="static" id="renameSectionDialog" tabindex="-1">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<h1 class="modal-title fs-5">Rename section</h1>
						<!-- <button type="button" class="btn-close" data-bs-dismiss="modal"></button> -->
					</div>
					<div class="modal-body">
						<div class="mb-3">
							<label class="form-label">Section Name</label>
							<input type="text" class="form-control" placeholder="" v-model="renameSectionData.title" />
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-light" data-bs-dismiss="modal" @click.prevent="cancelRenameSection">Cancel</button>
						<button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click.prevent="renameSection">Save</button>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="sectionOrderDialog" tabindex="-1">
			<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Edit Section Order</h5>
						<!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" /> -->
					</div>
					<div class="modal-body">
						<draggable
							tag="div"
							v-model="sections"
							v-bind="{
								animation: 200,
							}"
						>
							<transition-group tag="ul" class="list-group">
								<li class="list-group-item d-flex justify-content-between" v-for="section in sections" :key="section.id">
									<span>{{ section.title }} ({{ section.clips.length }})</span>
									<i class="drag-handle bi bi-list ms-2 text-muted d-block" />
								</li>
							</transition-group>
						</draggable>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-primary" data-bs-dismiss="modal">Done</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="less">
.viewport {
  background: #fefefe;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>

<script>
import path from 'path'
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

			ignoreWatcher: false,

			remoteControlEnabled: null,
			remoteControlHost: "0.0.0.0",
			remoteControlPort: 0,
			remoteControlToast: null
		}
	},
	async mounted() {
		this.ignoreWatcher = true;


		this.favorites = await this.$storage.get("favorites") ?? [];
		this.sections = await this.$storage.get("sections") ?? [];
		this.volume = await this.$storage.get("volume") ?? 1.0;

		this.$nextTick(() => {
			this.ignoreWatcher = false;
		});

		this.updateMediaDevices();
		navigator.mediaDevices.ondevicechange = (event) => {
			this.updateMediaDevices();
		};

		this.newClipDialog = new bootstrap.Modal(this.$el.querySelector('#newClipDialog'));
		this.renameSectionDialog = new bootstrap.Modal(this.$el.querySelector('#renameSectionDialog'));

		SocketService.$on("connected", (e) => {
			if (this.remoteControlToast) {
				this.remoteControlToast.hide();
				this.remoteControlToast = null;
			}

			let socketToast = document.getElementById('socketOpenToast');

			if (socketToast) {
				this.remoteControlToast = new bootstrap.Toast(document.getElementById('socketOpenToast'), {
					autohide: false
				});

				this.remoteControlToast.show();
			}
		});

		SocketService.$on("close", (e) => {
			if (this.remoteControlToast) {
				this.remoteControlToast.hide();
				this.remoteControlToast = null;
			}
		});

		SocketService.$on("message", (data) => {
			switch (data.type) {
				case "clientConnected":
					SocketService.send({
						type: "outputDevices",
						outputDevices: this.outputDevices,
						_clientId: data.clientId
					});
					SocketService.send({
						type: "sinkId",
						sinkId: this.sinkId,
						_clientId: data.clientId
					});
					SocketService.send({
						type: "volume",
						volume: this.volume,
						_clientId: data.clientId
					});
					break;
				case "sinkId":
					if (this.sinkId != data.sinkId) {
						this.sinkId = data.sinkId;
					}
					break;
				case "volume":
					if (this.volume != data.volume) {
						this.volume = data.volume;
					}
					break;

				case "playClip":
					this.playClip(data.clipId, data.startFrom);
					break;
				case "pauseClip":
					this.pauseClip(data.clipId);
					break;
				case "stopClip":
					this.stopClip(data.clipId);
					break;
			}

			this.$nextTick(() => {
				this.ignoreWatcher = false;
			});
		});

		this.remoteControlEnabled = await this.$remoteControl.isEnabled();

		if (this.remoteControlEnabled) {
			this.remoteControlHost = await this.$remoteControl.getIP();
			this.remoteControlPort = await this.$remoteControl.getPort();

			await SocketService.connect(`ws://${this.remoteControlHost}:${this.remoteControlPort}/master`);
		}
	},
	methods: {
		gridItemsPerRow() {
			// if (window.innerWidth >= 992) {
			// 	return 6;
			// } else if (window.innerWidth >= 768) {
			// 	return 4;
			// } else if (window.innerWidth >= 576) {
			// 	return 3;
			// } else {
			// 	return 2;
			// }

			if (window.innerWidth >= 1200) {
				return 12;
			} else if (window.innerWidth >= 768) {
				return 6;
			} else if (window.innerWidth >= 567) {
				return 4;
			} else {
				return 3;
			}
		},
		gridItemSize() {
			let itemsPerRow = this.gridItemsPerRow();

			return (window.innerWidth - ((itemsPerRow + 1) * this.gridItemPadding())) / itemsPerRow;
		},
		gridItemPadding() {
			// if (window.innerWidth >= 576) {
			// 	return 24;
			// } else {
			// 	return 16;
			// }

			if (window.innerWidth >= 576) {
				return 16;
			} else {
				return 8;
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

		playClip(clipId, startFrom) {
			if (!this.playbackQueue[clipId] || !isNaN(startFrom)) {
				let clip = this.clips.find(_ => _.id === clipId);

				this.$refs["mediaPlayer"].play({
					...clip,
					startFrom: !isNaN(startFrom) ? startFrom : undefined,
				});
			} else {
				this.$refs["mediaPlayer"].playPause(clipId);
			}
		},
		pauseClip(clipId) {
			this.$refs["mediaPlayer"].playPause(clipId);
		},
		stopClip(clipId) {
			this.$refs["mediaPlayer"].stop(clipId);
		},

		addSection() {
			this.sections.push({
				...this.newSectionData,
				id: uuid()
			});
			// this.sections = [...this.sections];

			this.cancelAddSection();
		},
		cancelAddSection() {
			this.newSectionData = {
				id: null,
				title: "",
				clips: [],
				collapsed: false
			}
		},

		deleteSection(sectionId) {
			let section = this.sections.find(_ => _.id === sectionId);
			if (section) {
				section.clips.forEach(clip => {
					if (this.favorites.includes(clip.id)) {
						this.favorites.splice(this.favorites.indexOf(clip.id), 1);
					}
				});
				this.sections.splice(this.sections.indexOf(section), 1);

				this.sections = [...this.sections];
			}
		},

		startRenameSection(sectionId) {
			this.renameSectionData = {...this.sections.find(_ => _.id === sectionId)}
			this.renameSectionDialog.show();
		},
		renameSection() {
			let section = this.sections.find(_ => _.id === this.renameSectionData.id);
			if (section) {
				section.title = this.renameSectionData.title;

				this.sections = [...this.sections];
			}

			this.cancelRenameSection();
		},
		cancelRenameSection() {
			this.renameSectionData = {
				id: null,
				title: null,
				clips: []
			}
		},

		sortSection(sectionId, sortType) {
			let section = this.sections.find(_ => _.id === sectionId);
			if (section) {
				switch (sortType) {
					case 1:
						// Sort by name a -> Z, ignore artist name
						section.clips = section.clips.sort((a, b) => a.name.localeCompare(b.name));
						break;
					case 2:
						// Sort by name z -> a, ignore artist name
						section.clips = section.clips.sort((a, b) => b.name.localeCompare(a.name));
						break;
					case 3:
						section.clips = section.clips.sort((a, b) => {
							if (!a.artist?.length) return 1;
							if (!b.artist?.length) return -1;
							return a.artist.localeCompare(b.artist) || a.name.localeCompare(b.name);
						});
						// Sort by artist name a -> z, then by clip name a -> z
						break;
					case 4:
						// Sort by artist name z -> a, then by clip name a -> z
						section.clips = section.clips.sort((a, b) => {
							if (!a.artist?.length) return 1;
							if (!b.artist?.length) return -1;
							return b.artist.localeCompare(a.artist) || b.name.localeCompare(a.name);
						});
						break;
					default: break;
				}

				this.sections = [...this.sections]
			}
		},

		selectAudioClip(sectionId) {
			this.$dialog.open({
				properties: ['openFile'],
				filters: [
					{ name: 'Audio', extensions: ['wav', 'mp3', 'ogg', 'webm'] }
				]
			}, (result) => {
				if (result.canceled) return;

				this.newClipData.section = sectionId;
				this.newClipData.file = result.filePaths[0];

				let clipName = path.basename(this.newClipData.file, path.extname(this.newClipData.file));
				this.newClipData.name = clipName

				this.newClipDialog.show();
			});
		},
		saveAudioClip() {
			this.sections.find(_ => _.id === this.newClipData.section).clips.push({
				...this.newClipData,
				id: uuid(),
				section: undefined
			});

			this.sections = [...this.sections];

			this.cancelSaveAudioClip();
		},
		cancelSaveAudioClip() {
			this.newClipData = {
				id: null,
				name: null,
				artist: null,
				section: null,
				file: null,
				playbackMode: PLAYBACK_MODE.Trigger
			}
		},

		async updateMediaDevices() {
			this.outputDevices = [];

			await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
			let devices = await navigator.mediaDevices.enumerateDevices();
			this.outputDevices = devices.filter(_ => _.kind === 'audiooutput');
			this.sinkId = await this.$storage.get("sinkId") ?? this.outputDevices[0].deviceId;

			SocketService.send({
				type: "outputDevices",
				outputDevices: this.outputDevices,
			});
		},
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
		async remoteControlEnabled(value, oldValue) {
			if (oldValue === null) return;

			if (!value) {
				SocketService.close();
			}

			await this.$remoteControl.setEnabled(value);

			if (value) {
				this.remoteControlHost = await this.$remoteControl.getIP();
				this.remoteControlPort = await this.$remoteControl.getPort();

				SocketService.connect(`ws://${this.remoteControlHost}:${this.remoteControlPort}/master`);
			}
		},

		favorites(value, oldValue) {
			if (!oldValue) return;

			this.$storage.set("favorites", value);
			SocketService.send({ type: "favorites", favorites: this.favorites });
		},
		sections(value, oldValue) {
			if (!oldValue) return;

			this.$storage.set("sections", value);
			SocketService.send({ type: "sections", sections: this.sections });
		},
		sinkId(value, oldValue) {
			if (!oldValue) return;

			this.$storage.set("sinkId", value);

			if (!this.ignoreWatcher) {
				SocketService.send({ type: "sinkId", sinkId: this.sinkId });
			}
		},
		volume(value) {
			this.$storage.set("volume", value);

			if (!this.ignoreWatcher) {
				SocketService.send({ type: "volume", volume: this.volume });
			}
		},
		playbackQueue(value) {
			SocketService.send({ type: "playbackQueue", playbackQueue: this.playbackQueue });
		}
	}
}
</script>