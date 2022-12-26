<template>
	<div class="scroll-root" @scroll.passive="handleScroll">
		<div class="scroll-viewport position-relative" :style="viewportStyle">
			<section
				class="clip-section bg-white position-absolute w-100"
				v-for="(section, index) in visibleSections"
				:key="section.id"
				:style="sectionStyle(section.id)"
			>
				<div class="section-header bg-white px-3 px-md-4 pt-3 pb-2">
					<slot name="header" :section="section" />
				</div>

				<draggable
					tag="div"
					class="px-3 px-md-4 py-2"
					:class="{'edit-mode': isInEditMode}"
					:style="{height: `${sectionHeight(section.id) - m_headerHeight}px`}"
					v-model="section.clips"
					v-bind="itemDraggableOptions"
					@change="itemMoved"
				>
					<transition-group tag="div" class="row g-2 g-sm-3 position-relative">
						<div
							class="col-4 col-sm-3 col-md-2 col-xl-1"
							v-for="(item, index) in section.clips"
							:key="item.id"
						>
							<slot name="item" v-if="item" :section="section" :item="item" />
						</div>
					</transition-group>
				</draggable>
			</section>
		</div>
	</div>
</template>

<style lang="less">
.scroll-root {
	overflow: scroll;
	-webkit-overflow-scrolling: touch;
}
</style>

<script>
import draggable from 'vuedraggable'

export default {
	props: [
		"value",
		"headerHeight",
		"itemHeight",
		"itemPadding",
		"itemsPerRow",
		"itemBuffer",
		"isInEditMode"
	],
	components: {
		draggable
	},
	data() {
		return {
			items: this.value,
			scrollTop: 0,

			m_headerHeight: 0,
			m_itemHeight: 0,
			m_itemPadding: 0,
			m_itemsPerRow: 4,
			m_itemBuffer: 2,

			m_sectionHeights: [],

			m_visibleSections: []
		}
	},
	mounted() {
		window.addEventListener("resize", this.handleResize);

		this.handleResize();
		this.handleScroll();
	},
	destroyed() {
		window.removeEventListener("resize", this.handleResize);
	},
	methods: {
		handleResize() {
			this.m_headerHeight = typeof this.headerHeight === "function" ? this.headerHeight() : this.headerHeight;
			this.m_itemHeight = typeof this.itemHeight === "function" ? this.itemHeight() : this.itemHeight;
			this.m_itemPadding = typeof this.itemPadding === "function" ? this.itemPadding() : this.itemPadding;
			this.m_itemsPerRow = typeof this.itemsPerRow === "function" ? this.itemsPerRow() : this.itemsPerRow;
			this.m_itemBuffer = typeof this.itemBuffer === "function" ? this.itemBuffer() : this.itemBuffer;

			this.m_sectionHeights = [];
			this.value.forEach((section, index) => {
				let rows = Math.ceil(section.clips.length / this.m_itemsPerRow);
				this.m_sectionHeights.push(this.m_headerHeight + (this.m_itemHeight * rows) + (this.m_itemPadding * Math.max(rows - 1, 0)) + 16);
			});
		},
		handleScroll() {
			let visibleSections = [];

			this.value.forEach((section, index) => {
				let topY = this.m_sectionHeights.slice(0, index).reduce((total, add) => total + add, 0);
				let bottomY = topY + this.m_sectionHeights[index];

				if (this.$el.scrollTop > topY - (this.$el.clientHeight * 1.5) && this.$el.scrollTop <= bottomY + (this.$el.clientHeight * 0.5)) {
					visibleSections.push(section.id);

			// 		this.m_visibleItemsPerSection[section.id] = [];
			// 		section.clips.forEach((item, index) => {
			// 			let itemRow = Math.floor(index / this.m_itemsPerRow);
			// 			let itemColumn = index % this.m_itemsPerRow;

			// 			let itemTopY = (this.m_itemHeight * itemRow) + (this.m_itemPadding * itemRow) + topY;
			// 			let itemBottomY = itemTopY + this.m_itemHeight;

			// 			if (this.$el.scrollTop > itemTopY - (this.$el.clientHeight * 2) && this.$el.scrollTop <= itemBottomY + (this.$el.clientHeight * 1.0)) {
			// 				this.m_visibleItemsPerSection[section.id].push(item)
			// 			}
			// 		});
				}
			});

			if (JSON.stringify(this.m_visibleSections) !== JSON.stringify(visibleSections)) {
				this.m_visibleSections = visibleSections;
			}
		},
		sectionStyle(sectionId) {
			// return
			let sectionIndex = this.value.findIndex(_ => _.id === sectionId);

			return {
				height: `${this.m_sectionHeights[sectionIndex]}px`,
				top: `${this.m_sectionHeights.slice(0, sectionIndex).reduce((total, add) => total + add, 0)}px`
			}
		},
		sectionHeight(sectionId) {
			return this.m_sectionHeights[this.value.findIndex(_ => _.id === sectionId)];
		},
		itemStyle(sectionId, itemId) {
			let itemIndex = this.value.find(_ => _.id === sectionId).clips.findIndex(_ => _.id === itemId);
			let itemRow = Math.floor(itemIndex / this.m_itemsPerRow);
			let itemColumn = itemIndex % this.m_itemsPerRow;

			return {
				top: `${(this.m_itemHeight * itemRow) + (this.m_itemPadding * itemRow)}px`,
				left: `${(this.m_itemHeight * itemColumn) + (this.m_itemPadding * itemColumn)}px`,
			}
		},

		itemMoved(e) {
			this.handleResize();
			this.$emit("input", [...this.items]);
		}
	},
	computed: {
		rowHeight() {
			return this.m_itemHeight + this.m_itemPadding;
		},
		viewportHeight() {
			return this.m_sectionHeights.reduce((total, add) => total + add, 0);
		},
		viewportStyle() {
			return {
				height: `${this.viewportHeight}px`,
			};
		},

		visibleSections() {
			return this.value.filter(_ => this.m_visibleSections.includes(_.id));
		},

		sectionDraggableOptions() {
			return {
				animation: 200,
				draggable: ".edit-mode > div > .clip-section",
				handle: ".section-move-handle",
				swapThreshold: 1,
				direction: "vertical"
			}
		},
		itemDraggableOptions() {
			return {
				animation: 200,
				draggable: ".edit-mode > div > div"
			}
		}
	},
	watch: {
		value(newValue, oldValue) {
			this.items = newValue;

			this.handleResize();
			this.handleScroll();
		}
	}
}
</script>