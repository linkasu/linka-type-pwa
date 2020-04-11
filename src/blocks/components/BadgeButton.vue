<template>
  <v-badge :color="color" overlap width="100%" left >
    <span  slot="badge">{{hint}}</span>
    <!--slot can be any component-->
    <div style="padding:5px;">

    <v-btn block @click="$emit('buttonclick', $event)" :tabindex="focus?0:-1">{{value}}</v-btn>
    </div>

  </v-badge>
</template>


<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component({})
export default class BadgeButton extends Vue {
  @Prop() hint: Number | String | undefined;
  @Prop({ default: true }) focus: boolean|undefined;
  @Prop({ default: false }) overlap: boolean|undefined;
  @Prop({ default: false }) top: boolean|undefined;
  @Prop({ required: true }) value: String|undefined;
  @Prop({ default: "secondary" }) color: String|undefined;
}
</script>

<style >
.v-badge {
  width: 100%;
}
.v-badge--overlap .v-badge__badge{
    top: 50% !important;
    position: absolute;
    transform: translate(0%, -50%);
}

.v-badge .v-btn__content {
  overflow: hidden;
  display: block !important;
  width: 0px;
}
</style>