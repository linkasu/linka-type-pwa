<template>
  <v-layout>
      <v-flex xs6 md2 v-for="(n, i) of items" :key="n">
        <v-badge :color="color" overlap width="100%" bottom left>
          <span slot="badge">{{i+1}}</span>
          <!--slot can be any component-->
        <v-btn block @click="$emit('buttonclick', n, i)" :tabindex="focus?0:-1">{{n}}</v-btn>
        </v-badge>
      </v-flex>
    </v-layout>
</template>


<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';

@Component({
  props:{
    items:{
      type:Array,
      default:[]
    },
    focus:{
      type:Boolean,
      default:true
    },
    color:{
      type:String,
      default:'primary'
    }
  }
})
export default class ButtonRow extends Vue {}
</script>
<style  scoped>

.layout {
  flex-wrap: wrap;
}
.v-badge {
  width: 100%;
}
</style>