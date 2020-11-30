/**
 * Exadel LinkChecker clientlib.
 * Common utilities
 */
(function (window, document, $, Granite) {
    'use strict';

    var Utils = Granite.ELC = (Granite.ELC || {});

    /**
     * @param {string} text - text to format
     * @param {object} dictionary - dictionary object to replace '{{key}}' injections
     * @return {string}
     */
    function format(text, dictionary) {
        return text.replace(/{{(\w+)}}/g, function (match, term) {
            if (term in dictionary) return String(dictionary[term]);
            return match;
        });
    }
    Utils.format = format;

    let sharableDialog;
    /** Common sharable dialog instance getter */
    function getDialog() {
        if (!sharableDialog) {
            sharableDialog = new Coral.Dialog().set({
                backdrop: Coral.Dialog.backdrop.STATIC,
                interaction: 'off'
            }).on('coral-overlay:close', function (e) {
                e.target.remove();
            });
            sharableDialog.classList.add('elc-dialog');
        }
        return sharableDialog;
    }
    Utils.getSharableDlg = getDialog;

    var CLOSE_LABEL = Granite.I18n.get('Close');
    var FINISHED_LABEL = Granite.I18n.get('Finished');

    /**
     * Create {@return ProcessLogger} wrapper
     * @return {ProcessLogger}
     *
     * @typedef ProcessLogger
     * @method finished
     * @method log
     */
    function createLoggerDialog(title, processingMsg) {
        var el = getDialog();
        el.variant = 'default';
        el.header.textContent = title;
        el.header.insertBefore(new Coral.Wait(), el.header.firstChild);
        el.footer.innerHTML = '';
        el.content.innerHTML = '';

        var processingLabel = document.createElement('p');
        processingLabel.textContent = processingMsg;
        el.content.append(processingLabel);

        document.body.appendChild(el);
        el.show();

        return {
            dialog: el,
            finished: function () {
                el.header.textContent = FINISHED_LABEL;
                processingLabel.remove();

                var closeBtn = new Coral.Button();
                closeBtn.variant = 'primary';
                closeBtn.label.textContent = CLOSE_LABEL;
                closeBtn.on('click', function () {
                    el.hide();
                });

                el.footer.appendChild(closeBtn);
            },
            log: function (message, safe) {
                var logItem = document.createElement('div');
                logItem.className = 'elc-log-item';
                logItem[safe ? 'textContent' : 'innerHTML'] = message;
                el.content.insertAdjacentElement('beforeend', logItem);
            }
        };
    }
    Utils.createLoggerDialog = createLoggerDialog;

    var PROCESSING_LABEL = Granite.I18n.get('Processing');
    var START_REPLACEMENT_LABEL = Granite.I18n.get('Link update is in progress ...');

    /**
     * Process bulk update for the links.
     * @param {Array} items - items to update
     * @param {Function} updateRequest - item update request builder
     * @return {JQuery.Deferred}
     */
    function bulkLinksUpdate(items, updateRequest) {
        var logger = createLoggerDialog(PROCESSING_LABEL, START_REPLACEMENT_LABEL);
        var requests = $.Deferred().resolve();
        requests = items.reduce(function (query, item) {
            return query.then(updateRequest(item, logger));
        }, requests);
        requests.always(function () {
            logger.finished();
            logger.dialog.on('coral-overlay:close', function () {
                $(window).adaptTo('foundation-ui').wait();
                window.location.reload();
            });
        });
        return requests;
    }
    Utils.bulkLinksUpdate = bulkLinksUpdate;

})(window, document, Granite.$, Granite);