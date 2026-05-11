<template>
  <section class="card">
    <h2>System Design Draft</h2>
    <div class="row">
      <input v-model="title" placeholder="Diagram title" />
      <button @click="addNode">Add Node</button>
      <button class="secondary" @click="addEdge">Add Edge</button>
      <button @click="saveDiagram">Save Diagram</button>
    </div>
    <p>Current nodes: {{ nodes.length }} | edges: {{ edges.length }}</p>

    <h4>Nodes</h4>
    <ul>
      <li v-for="node in nodes" :key="node.id">
        {{ node.id }} - {{ node.type }} - {{ node.label }} ({{ node.x }}, {{ node.y }})
      </li>
    </ul>

    <h4>Edges</h4>
    <ul>
      <li v-for="edge in edges" :key="edge.id">
        {{ edge.source }} -> {{ edge.target }} ({{ edge.label }})
      </li>
    </ul>
  </section>

  <section class="card">
    <h3>Saved Diagrams</h3>
    <button class="secondary" @click="loadDiagrams">Refresh</button>
    <ul>
      <li v-for="item in diagrams" :key="item.diagramId">{{ item.title }} ({{ item.nodes.length }} nodes)</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { createDiagram, listDiagrams } from "../api/client";
import { useAppStore } from "../stores/app";
import type { DiagramEdge, DiagramNode, SystemDesignDiagram } from "../types/api";

const appStore = useAppStore();
const title = ref("Sample Architecture");
const nodes = ref<DiagramNode[]>([]);
const edges = ref<DiagramEdge[]>([]);
const diagrams = ref<SystemDesignDiagram[]>([]);

function addNode() {
  const id = `n${nodes.value.length + 1}`;
  nodes.value.push({
    id,
    type: "service",
    label: `Service ${nodes.value.length + 1}`,
    x: 100 + nodes.value.length * 80,
    y: 100
  });
}

function addEdge() {
  if (nodes.value.length < 2) {
    return;
  }
  const source = nodes.value[nodes.value.length - 2].id;
  const target = nodes.value[nodes.value.length - 1].id;
  edges.value.push({
    id: `e${edges.value.length + 1}`,
    source,
    target,
    label: "HTTP"
  });
}

async function saveDiagram() {
  await createDiagram({
    appId: appStore.appId,
    title: title.value,
    description: "MVP diagram",
    nodes: nodes.value,
    edges: edges.value,
    canvasMeta: { zoom: 1, version: "1.0" }
  });
  await loadDiagrams();
}

async function loadDiagrams() {
  diagrams.value = await listDiagrams();
}

void loadDiagrams();
</script>
