<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) BoonEx Pty Limited - http://www.boonex.com/
 * CC-BY License - http://creativecommons.org/licenses/by/3.0/
 *
 * @defgroup    Albums Albums
 * @ingroup     TridentModules
 *
 * @{
 */

bx_import ('BxBaseModTextModule');

/**
 * Albums module
 */
class BxAlbumsModule extends BxBaseModTextModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function checkAllowedSetThumb ()
    {
        return CHECK_ACTION_RESULT_NOT_ALLOWED;
    }
}

/** @} */