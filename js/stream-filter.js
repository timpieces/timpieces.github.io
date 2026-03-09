(function () {
  function splitList(value) {
    if (!value) return [];
    return value
      .split(",")
      .map(function (item) {
        return item.trim().toLowerCase();
      })
      .filter(Boolean);
  }

  function normalizeList(value) {
    return splitList(value).join(",");
  }

  function normalizeQuality(value) {
    if (!value) return "";
    var normalized = value.trim().toLowerCase();
    if (normalized === "low" || normalized === "medium" || normalized === "high") {
      return normalized;
    }
    return "";
  }

  function getQualityRank(value) {
    if (value === "low") return 1;
    if (value === "medium") return 2;
    if (value === "high") return 3;
    return 0;
  }

  function getQueryFilters() {
    var params = new URLSearchParams(window.location.search);
    return {
      stream: params.get("stream") || "",
      tag: params.get("tag") || "",
      from: params.get("from") || "",
      to: params.get("to") || "",
      quality: params.get("quality") || "",
    };
  }

  function setQuery(activeTab, filters, quality, defaultQuality) {
    var params = new URLSearchParams(window.location.search);
    params.delete("stream");
    params.delete("tag");
    params.delete("from");
    params.delete("to");
    params.delete("quality");

    if (quality && (!defaultQuality || quality !== defaultQuality)) {
      params.set("quality", quality);
    }

    if (activeTab === "custom") {
      var normalizedStream = normalizeList(filters.stream);
      if (normalizedStream) {
        params.set("stream", normalizedStream);
      } else {
        params.set("stream", "custom");
      }
      var normalizedTag = normalizeList(filters.tag);
      if (normalizedTag) params.set("tag", normalizedTag);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
    } else if (activeTab && activeTab !== "recent" && activeTab !== "all") {
      params.set("stream", activeTab);
    }

    var next = params.toString();
    var url = window.location.pathname + (next ? "?" + next : "");
    window.history.replaceState({}, "", url);
  }

  function matchesQuality(item, quality) {
    if (!quality) return true;
    var itemQuality = normalizeQuality(item.getAttribute("data-quality") || "");
    var itemRank = getQualityRank(itemQuality);
    var filterRank = getQualityRank(quality);
    if (!itemRank || !filterRank) return true;
    return itemRank >= filterRank;
  }

  function applyStream(stream, quality) {
    var items = document.querySelectorAll(".stream-item");
    items.forEach(function (item) {
      var itemStream = item.getAttribute("data-stream");
      var isRecent = item.getAttribute("data-recent") === "true";
      var passesQuality = matchesQuality(item, quality);
      var shouldShow =
        !stream ||
        stream === "custom" ||
        stream === "all" ||
        (stream === "recent" ? isRecent : itemStream === stream);
      shouldShow = shouldShow && passesQuality;
      item.classList.toggle("is-hidden", !shouldShow);
    });
  }

  function applyCustom(filters, quality) {
    var items = document.querySelectorAll(".stream-item");
    var streamList = splitList(filters.stream);
    var tagList = splitList(filters.tag);
    var from = filters.from;
    var to = filters.to;
    var hasStream = streamList.length > 0;
    var hasTags = tagList.length > 0;
    var hasFrom = !!from;
    var hasTo = !!to;

    items.forEach(function (item) {
      var itemStream = (item.getAttribute("data-stream") || "").toLowerCase();
      var itemTags = splitList(item.getAttribute("data-tags") || "");
      var itemDate = item.getAttribute("data-date") || "";

      var matchesStream = !hasStream || (itemStream && streamList.indexOf(itemStream) !== -1);
      var matchesTags = !hasTags || (itemTags.length && tagList.some(function (tag) {
        return itemTags.indexOf(tag) !== -1;
      }));
      var matchesFrom = !hasFrom || (itemDate && itemDate >= from);
      var matchesTo = !hasTo || (itemDate && itemDate <= to);
      var passesQuality = matchesQuality(item, quality);
      var shouldShow = matchesStream && matchesTags && matchesFrom && matchesTo && passesQuality;

      item.classList.toggle("is-hidden", !shouldShow);
    });
  }

  function setActiveTab(stream) {
    var inputs = document.querySelectorAll(".stream-tabs .btn-check");
    inputs.forEach(function (input) {
      var isActive = input.getAttribute("data-stream") === stream;
      input.checked = isActive;
    });
  }

  function setCustomVisibility(show) {
    var panel = document.getElementById("custom-filters");
    if (panel) panel.hidden = !show;
  }

  function setCustomInputs(filters) {
    var streamInput = document.getElementById("custom-stream");
    var tagInput = document.getElementById("custom-tags");
    var fromInput = document.getElementById("custom-from");
    var toInput = document.getElementById("custom-to");
    if (streamInput) setChipValues("stream", splitList(filters.stream === "custom" ? "" : filters.stream));
    if (tagInput) setChipValues("tags", splitList(filters.tag));
    if (fromInput) fromInput.value = yearFromDate(filters.from);
    if (toInput) toInput.value = yearFromDate(filters.to);
  }

  function getCustomInputs() {
    var streamInput = document.getElementById("custom-stream");
    var tagInput = document.getElementById("custom-tags");
    var fromInput = document.getElementById("custom-from");
    var toInput = document.getElementById("custom-to");
    var fromYear = fromInput ? fromInput.value : "";
    var toYear = toInput ? toInput.value : "";
    return {
      stream: streamInput ? streamInput.value.trim() : "",
      tag: tagInput ? tagInput.value.trim() : "",
      from: fromYear ? fromYear + "-01-01" : "",
      to: toYear ? toYear + "-12-31" : "",
    };
  }

  function yearFromDate(value) {
    if (!value) return "";
    return value.slice(0, 4);
  }

  function getPicker(name) {
    return document.querySelector('.chip-picker[data-picker="' + name + '"]');
  }

  function getChipValues(name) {
    var picker = getPicker(name);
    if (!picker) return [];
    var chips = picker.querySelectorAll(".chip");
    return Array.prototype.slice.call(chips).map(function (chip) {
      return chip.getAttribute("data-chip-value");
    });
  }

  function setChipValues(name, values) {
    var picker = getPicker(name);
    if (!picker) return;
    var list = picker.querySelector(".chip-list");
    if (!list) return;
    list.innerHTML = "";
    values.forEach(function (value) {
      addChip(picker, value);
    });
    syncHiddenInput(picker);
  }

  function addChip(picker, value) {
    if (!value) return;
    var normalized = value.toLowerCase();
    var existing = getChipValues(picker.getAttribute("data-picker"));
    if (existing.indexOf(normalized) !== -1) return;
    var list = picker.querySelector(".chip-list");
    if (!list) return;
    var chip = document.createElement("button");
    chip.type = "button";
    var pickerName = picker.getAttribute("data-picker");
    if (pickerName === "stream") {
      chip.className = "chip badge tag-badge stream-badge";
    } else if (pickerName === "tags") {
      chip.className = "chip tag-pill";
    } else {
      chip.className = "chip";
    }
    chip.setAttribute("data-chip-value", normalized);
    var label = pickerName === "tags" ? "#" + normalized : normalized;
    chip.innerHTML = label + ' <span aria-hidden="true">×</span>';
    chip.addEventListener("click", function () {
      chip.remove();
      syncHiddenInput(picker);
    });
    list.appendChild(chip);
  }

  function syncHiddenInput(picker) {
    var input = picker.querySelector('input[type="hidden"]');
    if (!input) return;
    var values = getChipValues(picker.getAttribute("data-picker"));
    input.value = values.join(",");
  }

  function initChipPickers() {
    var pickers = document.querySelectorAll(".chip-picker");
    pickers.forEach(function (picker) {
      var openButton = picker.querySelector("[data-chip-open]");
      var menu = picker.querySelector("[data-chip-menu]");
      if (!openButton || !menu) return;

      openButton.addEventListener("click", function (event) {
        event.stopPropagation();
        menu.hidden = !menu.hidden;
      });

      menu.querySelectorAll("[data-chip-value]").forEach(function (option) {
        option.addEventListener("click", function () {
          var value = option.getAttribute("data-chip-value");
          addChip(picker, value);
          syncHiddenInput(picker);
          menu.hidden = true;
        });
      });
    });

    document.addEventListener("click", function (event) {
      var openMenus = document.querySelectorAll(".chip-menu:not([hidden])");
      openMenus.forEach(function (menu) {
        if (menu.contains(event.target)) return;
        if (event.target.closest(".chip-picker")) return;
        menu.hidden = true;
      });
    });
  }

  function clearCustomFilters() {
    setChipValues("stream", []);
    setChipValues("tags", []);
    var fromInput = document.getElementById("custom-from");
    var toInput = document.getElementById("custom-to");
    if (fromInput) fromInput.value = "";
    if (toInput) toInput.value = "";
  }

  function setQualityToggleState(toggle, quality) {
    if (!toggle) return;
    toggle.setAttribute("data-quality", quality);
    var label = quality ? quality.charAt(0).toUpperCase() + quality.slice(1) : "Medium";
    var title = "Quality: " + label + " (click to change)";
    toggle.setAttribute("title", title);
    toggle.setAttribute("aria-label", title);
  }

  function nextQuality(current) {
    var order = ["low", "medium", "high"];
    var index = order.indexOf(current);
    if (index === -1) return "medium";
    return order[(index + 1) % order.length];
  }

  function init() {
    var inputs = document.querySelectorAll(".stream-tabs .btn-check");
    var qualityToggle = document.getElementById("quality-toggle");
    if (!inputs.length && !qualityToggle) return;

    var defaultQuality = normalizeQuality(
      qualityToggle ? qualityToggle.getAttribute("data-quality-default") : ""
    ) || "medium";
    var query = getQueryFilters();
    var quality = normalizeQuality(query.quality) || defaultQuality;

    setQualityToggleState(qualityToggle, quality);

    if (!inputs.length) {
      if (qualityToggle) {
        qualityToggle.addEventListener("click", function (event) {
          event.preventDefault();
          quality = nextQuality(quality);
          setQualityToggleState(qualityToggle, quality);
        });
      }
      return;
    }

    var hasCustomParams =
      !!query.tag ||
      !!query.from ||
      !!query.to ||
      (query.stream && query.stream.indexOf(",") !== -1) ||
      query.stream === "custom";

    var current = hasCustomParams ? "custom" : query.stream || "recent";
    setActiveTab(current);
    setCustomVisibility(current === "custom");

    if (current === "custom") {
      setCustomInputs(query);
      applyCustom(query, quality);
    } else {
      applyStream(current, quality);
    }

    inputs.forEach(function (input) {
      input.addEventListener("change", function () {
        if (!input.checked) return;
        var stream = input.getAttribute("data-stream");
        current = stream;
        setActiveTab(stream);
        if (stream === "custom") {
          setCustomVisibility(true);
          var customFilters = getCustomInputs();
          applyCustom(customFilters, quality);
          setQuery("custom", customFilters, quality, defaultQuality);
        } else {
          setCustomVisibility(false);
          applyStream(stream, quality);
          setQuery(stream, {}, quality, defaultQuality);
        }
      });
    });

    var applyButton = document.getElementById("custom-apply");
    if (applyButton) {
      applyButton.addEventListener("click", function () {
        var customFilters = getCustomInputs();
        applyCustom(customFilters, quality);
        setQuery("custom", customFilters, quality, defaultQuality);
      });
    }

    var clearButton = document.getElementById("custom-clear");
    if (clearButton) {
      clearButton.addEventListener("click", function () {
        clearCustomFilters();
        var customFilters = getCustomInputs();
        applyCustom(customFilters, quality);
        setQuery("custom", customFilters, quality, defaultQuality);
      });
    }

    if (qualityToggle) {
      qualityToggle.addEventListener("click", function (event) {
        event.preventDefault();
        quality = nextQuality(quality);
        setQualityToggleState(qualityToggle, quality);
        if (current === "custom") {
          var customFilters = getCustomInputs();
          applyCustom(customFilters, quality);
          setQuery("custom", customFilters, quality, defaultQuality);
        } else {
          applyStream(current, quality);
          setQuery(current, {}, quality, defaultQuality);
        }
      });
    }

    initChipPickers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
