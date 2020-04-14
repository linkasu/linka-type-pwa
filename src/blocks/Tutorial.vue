<template>
  <v-overlay>
    <v-card
    width="60vw"
    height="60vh">
      <v-card-title primary-title>
        Обучеющее видео
      </v-card-title>
      <v-card-media fill-height>
        <iframe style="width:100%;height:80%;" src="https://www.youtube.com/embed/Zb8KW44Bi8o" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </v-card-media>
    </v-card>
        <v-btn fab  right small color="primary" @click="$emit('close')">
      <v-icon dark>mdi-close</v-icon>
    </v-btn>

  </v-overlay>
</template>


<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class Tutorial extends Vue {
}
</script>